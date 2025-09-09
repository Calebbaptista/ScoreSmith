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
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🟣 Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Bot Ready
client.once(Events.ClientReady, () => {
  console.log(`🛡️ ScoreSmith is online as ${client.user.tag}`);
});
// Interaction Handler
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const { commandName, options } = interaction;

    // Point Type Management
    if (commandName === 'add-point-type') {
      const name = options.getString('name');
      await PointType.create({ name, guildId: interaction.guild.id });
      return await interaction.reply(`✅ Point type **${name}** added for this server.`);
    }

    if (commandName === 'delete-point-type') {
      const name = options.getString('name');
      await PointType.deleteOne({ name, guildId: interaction.guild.id });
      return await interaction.reply(`🗑️ Point type **${name}** deleted from this server.`);
    }

    if (commandName === 'set-point-type-access') {
      const name = options.getString('name');
      const role = options.getRole('role');
      await PointType.findOneAndUpdate(
        { name, guildId: interaction.guild.id },
        { requiredRoleIds: [role.id] }
      );
      return await interaction.reply(`🔐 Access for point type **${name}** set to <@&${role.id}>`);
    }
        // Add / Remove Points
    if (commandName === 'add' || commandName === 'remove') {
      const user = options.getUser('user');
      const type = options.getString('type');
      const amount = options.getInteger('amount');
      const isAdd = commandName === 'add';

      const typeData = await PointType.findOne({ name: type, guildId: interaction.guild.id });
      if (!typeData) return await interaction.reply(`❌ Point type **${type}** does not exist.`);

      if (typeData.requiredRoleIds?.length > 0) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasRole = typeData.requiredRoleIds.some(roleId => member.roles.cache.has(roleId));
        if (!hasRole) return await interaction.reply(`⛔ You lack permission to modify **${type}** points.`);
      }

      let record = await UserPoints.findOne({ userId: user.id });
      if (!record) record = new UserPoints({ userId: user.id, points: [] });

      const entry = record.points.find(p => p.typeName === type);
      if (entry) entry.value += isAdd ? amount : -amount;
      else if (isAdd) record.points.push({ typeName: type, value: amount });

      if (entry && entry.value < 0) entry.value = 0;

      await record.save();
      await interaction.reply(`${isAdd ? '➕ Added' : '➖ Removed'} **${amount} ${type}** ${isAdd ? 'to' : 'from'} <@${user.id}>.`);

      const log = await LogChannel.findOne({ guildId: interaction.guild.id });
      if (log) {
        const channel = await interaction.guild.channels.fetch(log.channelId);
        if (channel) {
          await channel.send({
            embeds: [{
              title: isAdd ? 'Points Added' : 'Points Removed',
              color: isAdd ? 0x6A0DAD : 0x8B0000,
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
        // Log Channel Setup
    if (commandName === 'set-log-channel') {
      const channel = options.getChannel('channel');
      await LogChannel.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { channelId: channel.id },
        { upsert: true }
      );
      return await interaction.reply(`📣 Log channel set to <#${channel.id}>.`);
    }

    // View Points
    if (commandName === 'view-points') {
      const user = options.getUser('user');
      const record = await UserPoints.findOne({ userId: user.id });
      if (!record || record.points.length === 0)
        return await interaction.reply(`📊 <@${user.id}> has no points.`);

      const validTypes = await PointType.find({ guildId: interaction.guild.id });
      const typeNames = validTypes.map(t => t.name);

      const lines = record.points
        .filter(p => typeNames.includes(p.typeName))
        .map(p => `• ${p.typeName}: ${p.value}`);

      if (lines.length === 0)
        return await interaction.reply(`📊 <@${user.id}> has no points in this server.`);

      return await interaction.reply(`📊 Points for <@${user.id}>:\n${lines.join('\n')}`);
    }
        // Rating System Management
    if (commandName === 'create-rating-system') {
      const name = options.getString('name');
      const description = options.getString('description') || '';
      await RatingSystem.create({ name, description });
      return await interaction.reply(`🛠️ Rating system **${name}** created.`);
    }

    if (commandName === 'delete-rating-system') {
      const name = options.getString('name');
      await RatingSystem.deleteOne({ name });
      return await interaction.reply(`🗑️ Rating system **${name}** deleted.`);
    }

    if (commandName === 'set-rating-system-access') {
      const name = options.getString('name');
      const role = options.getRole('role');
      await RatingSystem.findOneAndUpdate(
        { name },
        { requiredRoleIds: [role.id] }
      );
      return await interaction.reply(`🔐 Access for rating system **${name}** set to <@&${role.id}>`);
    }
        // Rate User
    if (commandName === 'rate-user') {
      const user = options.getUser('user');
      const system = options.getString('system');
      const score = options.getInteger('score');
      const reason = options.getString('reason') || 'No reason provided';

      if (score < 1 || score > 10)
        return await interaction.reply(`⚠️ Score must be between 1 and 10.`);

      const systemData = await RatingSystem.findOne({ name: system });
      if (!systemData) return await interaction.reply(`❌ Rating system **${system}** not found.`);

      if (systemData.requiredRoleIds?.length > 0) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasRole = systemData.requiredRoleIds.some(roleId => member.roles.cache.has(roleId));
        if (!hasRole) return await interaction.reply(`⛔ You lack permission to rate in **${system}**.`);
      }

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

    // Delete User Rating
    if (commandName === 'delete-user-rating') {
      const user = options.getUser('user');
      const system = options.getString('system');

      const record = await UserRatings.findOne({ userId: user.id });
      if (!record) return await interaction.reply(`⚠️ No ratings found for <@${user.id}>.`);

      record.ratings = record.ratings.filter(r => r.systemName !== system);
      await record.save();

      return await interaction.reply(`🗑️ Removed **${system}** rating from <@${user.id}>.`);
    }

    // View Ratings
    if (commandName === 'view-ratings') {
      const user = options.getUser('user');
      const system = options.getString('system');

      const record = await UserRatings.findOne({ userId: user.id });
      const rating = record?.ratings.find(r => r.systemName === system);

      if (!rating)
        return await interaction.reply(`📜 <@${user.id}> has no rating in **${system}**.`);

      return await interaction.reply(`📊 <@${user.id}> is rated **${rating.score}/10** in **${system}**.\n📖 Reason: ${rating.reason}`);
    }
      }

  // Autocomplete Handler
  if (interaction.isAutocomplete()) {
    const focused = interaction.options.getFocused(true);

    try {
      if (focused.name === 'type') {
        const pointTypes = await PointType.find({ guildId: interaction.guild.id });
        const filtered = pointTypes
          .filter(pt => pt.name.toLowerCase().includes(focused.value.toLowerCase()))
          .slice(0, 25)
          .map(pt => ({ name: pt.name, value: pt.name }));

        if (filtered.length > 0) {
          return await interaction.respond(filtered);
        } else {
          return await interaction.respond([{ name: 'No matches found', value: 'none' }]);
        }
      }

      if (focused.name === 'system') {
        const systems = await RatingSystem.find();
        const filtered = systems
          .filter(s => s.name.toLowerCase().includes(focused.value.toLowerCase()))
          .slice(0, 25)
          .map(s => ({ name: s.name, value: s.name }));

        if (filtered.length > 0) {
          return await interaction.respond(filtered);
        } else {
          return await interaction.respond([{ name: 'No matches found', value: 'none' }]);
        }
      }
    } catch (err) {
      console.error('❌ Autocomplete error:', err);
      if (!interaction.responded) {
        try {
          await interaction.respond([{ name: 'Error occurred', value: 'error' }]);
        } catch (_) {}
      }
    }
  }
});

// 🔐 Login
client.login(process.env.TOKEN);
