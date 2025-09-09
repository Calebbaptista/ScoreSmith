require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const mongoose = require('mongoose');

// Models
const PointType = require('./models/PointType');
const UserPoints = require('./models/UserPoints');
const LogChannel = require('./models/LogChannel');
const RatingSystem = require('./models/RatingSystem');
const UserRatings = require('./models/UserRatings');

// Discord Client
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('🟣 Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB Error:', err);
});

// Bot Ready
client.once(Events.ClientReady, () => {
  console.log(`🛡️ ScoreSmith is online as ${client.user.tag}`);
});

// Interaction Handler
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const { commandName, options } = interaction;

    // 🔧 Point System Commands
    if (commandName === 'addpointtype') {
      const name = options.getString('name');
      await PointType.create({ name });
      await interaction.reply(`✅ Point type **${name}** added.`);
    }

    if (commandName === 'deletepointtype') {
      const name = options.getString('name');
      await PointType.deleteOne({ name });
      await interaction.reply(`🗑️ Point type **${name}** deleted.`);
    }

    if (commandName === 'add') {
      const user = options.getUser('user');
      const type = options.getString('type');
      const amount = options.getInteger('amount');

      let record = await UserPoints.findOne({ userId: user.id });
      if (!record) record = new UserPoints({ userId: user.id, points: [] });

      const entry = record.points.find(p => p.typeName === type);
      if (entry) entry.value += amount;
      else record.points.push({ typeName: type, value: amount });

      await record.save();
      await interaction.reply(`➕ Added **${amount} ${type}** to <@${user.id}>.`);

      const log = await LogChannel.findOne({ guildId: interaction.guild.id });
      if (log) {
        const channel = await interaction.guild.channels.fetch(log.channelId);
        if (channel) {
          await channel.send({
            embeds: [{
              title: 'Points Added',
              color: 0x6A0DAD,
              fields: [
                { name: 'User', value: `<@${user.id}>`, inline: true },
                { name: 'Type', value: type, inline: true },
                { name: 'Amount', value: `${amount}`, inline: true },
                { name: 'By', value: interaction.user.tag, inline: true }
              ],
              timestamp: new Date().toISOString()
            }]
          });
        }
      }
    }

    if (commandName === 'remove') {
      const user = options.getUser('user');
      const type = options.getString('type');
      const amount = options.getInteger('amount');

      const record = await UserPoints.findOne({ userId: user.id });
      if (!record) return await interaction.reply(`⚠️ No points found for <@${user.id}>.`);

      const entry = record.points.find(p => p.typeName === type);
      if (!entry) return await interaction.reply(`⚠️ No ${type} points found.`);

      entry.value = Math.max(0, entry.value - amount);
      await record.save();
      await interaction.reply(`➖ Removed **${amount} ${type}** from <@${user.id}>.`);

      const log = await LogChannel.findOne({ guildId: interaction.guild.id });
      if (log) {
        const channel = await interaction.guild.channels.fetch(log.channelId);
        if (channel) {
          await channel.send({
            embeds: [{
              title: 'Points Removed',
              color: 0x8B0000,
              fields: [
                { name: 'User', value: `<@${user.id}>`, inline: true },
                { name: 'Type', value: type, inline: true },
                { name: 'Amount', value: `${amount}`, inline: true },
                { name: 'By', value: interaction.user.tag, inline: true }
              ],
              timestamp: new Date().toISOString()
            }]
          });
        }
      }
    }

    if (commandName === 'setlogchannel') {
      const channel = options.getChannel('channel');
      await LogChannel.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { channelId: channel.id },
        { upsert: true }
      );
      await interaction.reply(`📣 Log channel set to <#${channel.id}>.`);
    }

    if (commandName === 'viewpoints') {
      const user = options.getUser('user');
      const record = await UserPoints.findOne({ userId: user.id });
      if (!record || record.points.length === 0)
        return await interaction.reply(`📊 <@${user.id}> has no points.`);

      const lines = record.points.map(p => `• ${p.typeName}: ${p.value}`);
      await interaction.reply(`📊 Points for <@${user.id}>:\n${lines.join('\n')}`);
    }

    // 🏅 Rating System Commands
    if (commandName === 'createratingsystem') {
      const name = options.getString('name');
      const description = options.getString('description') || '';
      await RatingSystem.create({ name, description });
      await interaction.reply(`🛠️ Rating system **${name}** created.`);
    }

    if (commandName === 'deleteratingsystem') {
      const name = options.getString('name');
      await RatingSystem.deleteOne({ name });
      await interaction.reply(`🗑️ Rating system **${name}** deleted.`);
    }

    if (commandName === 'rateuser') {
      const user = options.getUser('user');
      const system = options.getString('system');
      const score = options.getInteger('score');
      const reason = options.getString('reason') || 'No reason provided';

      if (score < 1 || score > 10)
        return await interaction.reply(`⚠️ Score must be between 1 and 10.`);

      const systemExists = await RatingSystem.findOne({ name: system });
      if (!systemExists)
        return await interaction.reply(`❌ Rating system **${system}** not found.`);

      let record = await UserRatings.findOne({ userId: user.id });
      if (!record) record = new UserRatings({ userId: user.id, ratings: [] });

      const existing = record.ratings.find(r => r.systemName === system);
      if (existing) {
        existing.score = score;
        existing.reason = reason;
      } else {
        record.ratings.push({ systemName: system, score, reason });
      }

      await record.save();
      await interaction.reply(`🏅 Rated <@${user.id}> **${score}/10** in **${system}**.\n📜 Reason: ${reason}`);

      const log = await LogChannel.findOne({ guildId: interaction.guild.id });
      if (log) {
        const channel = await interaction.guild.channels.fetch(log.channelId);
        if (channel) {
          await channel.send({
            embeds: [{
              title: 'User Rated',
              color: 0x4169E1,
              fields: [
                { name: 'User', value: `<@${user.id}>`, inline: true },
                { name: 'System', value: system, inline: true },
                { name: 'Score', value: `${score}/10`, inline: true },
                { name: 'Reason', value: reason, inline: false },
                { name: 'By', value: interaction.user.tag, inline: true }
              ],
              timestamp: new Date().toISOString()
            }]
          });
        }
      }
    }

    if (commandName === 'deleteuserrating') {
      const user = options.getUser('user');
      const system = options.getString('system');

      const record = await UserRatings.findOne({ userId: user.id });
      if (!record) return await interaction.reply(`⚠️ No ratings found for <@${user.id}>.`);

      record.ratings = record.ratings.filter(r => r.systemName !== system);
      await record.save();

      await interaction.reply(`🗑️ Removed **${system}** rating from <@${user.id}>.`);
    }

    if (commandName === 'viewratings') {
      const user = options.getUser('user');
      const system = options.getString('system');

      const record = await UserRatings.findOne({ userId: user.id });
      const rating = record?.ratings.find(r => r.systemName ===
      const rating = record?.ratings.find(r => r.systemName === system);

      if (!rating)
        return await interaction.reply(`📜 <@${user.id}> has no rating in **${system}**.`);

      await interaction.reply(`📊 <@${user.id}> is rated **${rating.score}/10** in **${system}**.\n📖 Reason: ${rating.reason}`);
    }
  }

  // Autocomplete Handler
  if (interaction.isAutocomplete()) {
    const focused = interaction.options.getFocused(true);

    if (focused.name === 'type') {
      const pointTypes = await PointType.find();
      const filtered = pointTypes
        .filter(pt => pt.name.toLowerCase().includes(focused.value.toLowerCase()))
        .slice(0, 25)
        .map(pt => ({ name: pt.name, value: pt.name }));

      await interaction.respond(filtered);
    }

    if (focused.name === 'system') {
      const systems = await RatingSystem.find();
      const filtered = systems
        .filter(s => s.name.toLowerCase().includes(focused.value.toLowerCase()))
        .slice(0, 25)
        .map(s => ({ name: s.name, value: s.name }));

      await interaction.respond(filtered);
    }
  }
});

// Login
client.login(process.env.TOKEN);
