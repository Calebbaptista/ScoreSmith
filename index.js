require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const mongoose = require('mongoose');

// MongoDB Models
const PointType = require('./models/PointType');
const UserPoints = require('./models/UserPoints');
const Rating = require('./models/Rating');
const LogChannel = require('./models/LogChannel');

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

    if (commandName === 'createrating') {
      const name = options.getString('name');
      const threshold = options.getInteger('threshold');
      await Rating.create({ name, threshold });
      await interaction.reply(`🏅 Rating **${name}** created at **${threshold}** points.`);
    }

    if (commandName === 'rateuser') {
      const user = options.getUser('user');
      const type = options.getString('type');

      const record = await UserPoints.findOne({ userId: user.id });
      const entry = record?.points.find(p => p.typeName === type);
      const value = entry?.value || 0;

      const ratings = await Rating.find().sort({ threshold: -1 });
      const matched = ratings.find(r => value >= r.threshold);

      if (!matched) return await interaction.reply(`🏅 <@${user.id}> has no rating for ${type}.`);
      await interaction.reply(`🏅 <@${user.id}> is rated **${matched.name}** in ${type} (${value} pts).`);
    }

    if (commandName === 'viewratings') {
      const ratings = await Rating.find().sort({ threshold: -1 });
      if (ratings.length === 0) return await interaction.reply(`📜 No ratings defined.`);

      const lines = ratings.map(r => `• ${r.name}: ${r.threshold}+ pts`);
      await interaction.reply(`📜 Ratings:\n${lines.join('\n')}`);
    }
  }

  // Autocomplete Handler
  if (interaction.isAutocomplete()) {
    const focused = interaction.options.getFocused();
    const pointTypes = await PointType.find();

    const filtered = pointTypes
      .filter(pt => pt.name.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 25)
      .map(pt => ({ name: pt.name, value: pt.name }));

    await interaction.respond(filtered);
  }
});

// Login
client.login(process.env.TOKEN);
