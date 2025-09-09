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

    const replyEmbed = (title, description, color = 0x6A0DAD) => ({
      embeds: [{
        title,
        description,
        color,
        timestamp: new Date().toISOString()
      }]
    });

    const guildId = interaction.guild.id;

    // Point Type Management
    if (commandName === 'add-point-type') {
      const name = options.getString('name');
      await PointType.create({ name, guildId });
      return await interaction.reply(replyEmbed('✅ Point Type Added', `**${name}** has been added.`));
    }

    if (commandName === 'delete-point-type') {
      const name = options.getString('name');
      await PointType.deleteOne({ name, guildId });
      return await interaction.reply(replyEmbed('🗑️ Point Type Deleted', `**${name}** has been removed.`));
    }

    if (commandName === 'set-point-type-access') {
      const name = options.getString('name');
      const roles = ['role1', 'role2', 'role3']
        .map(roleName => options.getRole(roleName))
        .filter(role => role);

      if (roles.length === 0)
        return await interaction.reply(replyEmbed('⚠️ No Roles Provided', 'You must specify at least one role.', 0xFF4500));

      await PointType.findOneAndUpdate(
        { name, guildId },
        { requiredRoleIds: roles.map(r => r.id) }
      );

      const mentions = roles.map(r => `<@&${r.id}>`).join(', ');
      return await interaction.reply(replyEmbed('🔐 Access Updated', `**${name}** is now restricted to: ${mentions}`));
    }

    // Add / Remove Points
    if (commandName === 'add' || commandName === 'remove') {
      const user = options.getUser('user');
      const type = options.getString('type');
      const amount = options.getInteger('amount');
      const isAdd = commandName === 'add';

      const typeData = await PointType.findOne({ name: type, guildId });
      if (!typeData) return await interaction.reply(replyEmbed('❌ Invalid Type', `Point type **${type}** does not exist.`, 0xFF0000));

      if (typeData.requiredRoleIds?.length > 0) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasRole = typeData.requiredRoleIds.some(roleId => member.roles.cache.has(roleId));
        if (!hasRole) return await interaction.reply(replyEmbed('⛔ Access Denied', `You lack permission to modify **${type}**.`));
      }

      let record = await UserPoints.findOne({ userId: user.id });
      if (!record) record = new UserPoints({ userId: user.id, points: [] });

      const entry = record.points.find(p => p.typeName === type);
      if (entry) entry.value += isAdd ? amount : -amount;
      else if (isAdd) record.points.push({ typeName: type, value: amount });

      if (entry && entry.value < 0) entry.value = 0;

      await record.save();
      await interaction.reply(replyEmbed(
        isAdd ? '➕ Points Added' : '➖ Points Removed',
        `${isAdd ? 'Added' : 'Removed'} **${amount} ${type}** ${isAdd ? 'to' : 'from'} <@${user.id}>.`
      ));

      const log = await LogChannel.findOne({ guildId });
      if (log) {
        const channel = await interaction.guild.channels.fetch(log.channelId);
        if (channel) {
          await channel.send(replyEmbed(
            isAdd ? 'Points Added' : 'Points Removed',
            `User: <@${user.id}>\nType: ${type}\nAmount: ${amount}\nBy: ${interaction.user.tag}`
          ));
        }
      }
    }

    // Log Channel Setup
    if (commandName === 'set-log-channel') {
      const channel = options.getChannel('channel');
      await LogChannel.findOneAndUpdate(
        { guildId },
        { channelId: channel.id },
        { upsert: true }
      );
      return await interaction.reply(replyEmbed('📣 Log Channel Set', `Logs will be sent to <#${channel.id}>.`));
    }

    // View Points
    if (commandName === 'view-points') {
      const user = options.getUser('user');
      const record = await UserPoints.findOne({ userId: user.id });
      if (!record || record.points.length === 0)
        return await interaction.reply(replyEmbed('📊 No Points', `<@${user.id}> has no points.`));

      const validTypes = await PointType.find({ guildId });
      const typeNames = validTypes.map(t => t.name);

      const lines = record.points
        .filter(p => typeNames.includes(p.typeName))
        .map(p => `• ${p.typeName}: ${p.value}`);

      if (lines.length === 0)
        return await interaction.reply(replyEmbed('📊 No Points', `<@${user.id}> has no points in this server.`));

      return await interaction.reply(replyEmbed('📊 Point Totals', `Points for <@${user.id}>:\n${lines.join('\n')}`));
    }

    // Rating System Management
    if (commandName === 'create-rating-system') {
      const name = options.getString('name');
      const description = options.getString('description') || '';
      await RatingSystem.create({ name, description });
      return await interaction.reply(replyEmbed('🛠️ Rating System Created', `**${name}** is now available.`));
    }

    if (commandName === 'delete-rating-system') {
      const name = options.getString('name');
      await RatingSystem.deleteOne({ name });
      return await interaction.reply(replyEmbed('🗑️ Rating System Deleted', `**${name}** has been removed.`));
    }

    if (commandName === 'set-rating-system-access') {
      const name = options.getString('name');
      const roles = ['role1', 'role2', 'role3']
        .map(roleName => options.getRole(roleName))
        .filter(role => role);

      if (roles.length === 0)
        return await interaction.reply(replyEmbed('⚠️ No Roles Provided', 'You must specify at least one role.', 0xFF4500));

      await RatingSystem.findOneAndUpdate(
        { name },
        { requiredRoleIds: roles.map(r => r.id) }
      );

      const mentions = roles.map(r => `<@&${r.id}>`).join(', ');
      return await interaction.reply(replyEmbed('🔐 Access Updated', `**${name}** is now restricted to: ${mentions}`));
    }

    // Rate User
    if (commandName === 'rate-user') {
      const user = options.getUser('user');
      const system = options.getString('system');
      const score = options.getInteger('score');
      const reason = options.getString('reason') || 'No reason provided';

      if (score < 1 || score > 10)
        return await interaction.reply(replyEmbed('⚠️ Invalid Score', 'Score must be between 1 and 10.', 0xFF4500));

      const systemData = await RatingSystem.findOne({ name: system });
      if (!systemData) return await interaction.reply(replyEmbed('❌ System Not Found', `**${system}** does not exist.`, 0xFF0000));

      if (systemData.requiredRoleIds?.length > 0) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasRole = systemData.requiredRoleIds.some(roleId => member.roles.cache.has(roleId));
        if (!hasRole) return await interaction.reply(replyEmbed('⛔ Access Denied', `You lack permission to rate in **${system}**.`));
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
      await interaction.reply(replyEmbed(
        '🏅 Rating Submitted',
        `Rated <@${user.id}> **${score}/10** in **${system}**.\n📜 Reason: ${reason}`
      ));

      const log = await LogChannel.findOne({ guildId });
      if (log) {
        const channel = await interaction.guild.channels.fetch(log.channelId);
        if (channel) {
          await channel.send(replyEmbed(
            'User Rated',
            `User: <@${user.id}>\nSystem: ${system}\nScore: ${score}/10\nReason: ${reason}\nBy: ${interaction.user.tag}`,
            0x4169E1
          ));
        }
      }
    }

    // Delete User Rating
    if (commandName === 'delete-user-rating') {
      const user = options.getUser('user');
      const system = options.getString('system');

      const record = await UserRatings.findOne({ userId: user.id });
      if (!record) return await interaction.reply(replyEmbed('⚠️ No Ratings Found', `<@${user.id}> has no ratings.`));

      record.ratings = record.ratings.filter(r => r.systemName !== system);
      await record.save();

      return await interaction.reply(replyEmbed('🗑️ Rating Removed', `Removed **${system}** rating from <@${user.id}>.`));
    }

    // View Ratings
    if (commandName === 'view-ratings') {
      const user = options.getUser('user');
      const system = options.getString('system');

      const record = await UserRatings.findOne({ userId: user.id });
      const rating = record?.ratings.find(r => r.systemName === system);

      if (!rating)
        return await interaction.reply(replyEmbed('📜 No Rating Found', `<@${user.id}> has no rating in **${system}**.`));

      return await interaction.reply(replyEmbed(
        '📊 Rating Preview',
        `<@${user.id}> is rated **${rating.score}/10** in **${system}**.\n📖 Reason: ${rating.reason}`
      ));
    }

    // Setup Server
    if (commandName === 'setup-server') {
      const defaultPointTypes = ['Valor', 'Wisdom', 'Prestige'];
      const defaultRatingSystems = [
        { name: 'Honor', description: 'Measures ceremonial integrity' },
        { name: 'Discipline', description: 'Tracks consistency and effort' }
      ];

      for (const name of defaultPointTypes) {
        const exists = await PointType.findOne({ name, guildId });
        if (!exists) await PointType.create({ name, guildId });
      }

      for (const system of defaultRatingSystems) {
        const exists = await RatingSystem.findOne({ name: system.name });
        if (!exists) await RatingSystem.create(system);
      }

      return await interaction.reply(replyEmbed(
        '🏛️ Server Initialized',
        `Default point types and rating systems have been created.\n\nPlease run **/set-log-channel** to enable ceremonial logging.`
      ));
    }

    // Rank Preview
    if (commandName === 'rank-preview') {
      const user = options.getUser('user');

      const pointRecord = await UserPoints.findOne({ userId: user.id });
      const ratingRecord = await UserRatings.findOne({ userId: user.id });

      const validTypes = await PointType.find({ guildId });
      const validTypeNames = validTypes.map(t => t.name);

      const pointLines = (pointRecord?.points || [])
        .filter(p => validTypeNames.includes(p.typeName))
        .map(p => `• ${p.typeName}: ${p.value}`);

      const ratingLines = (ratingRecord?.ratings || [])
        .map(r => `• ${r.systemName}: ${r.score}/10`);

      const description = [
        `**Ceremonial Status for <@${user.id}>**`,
        pointLines.length ? `\n__Points__:\n${pointLines.join('\n')}` : '',
        ratingLines.length ? `\n__Ratings__:\n${ratingLines.join('\n')}` : '',
        (!pointLines.length && !ratingLines.length) ? '\nNo ceremonial data found.' : ''
      ].join('\n');

      return await interaction.reply({
        embeds: [{
          title: '📜 Rank Preview',
          description,
          color: 0x9370DB,
          timestamp: new Date().toISOString()
        }]
      });
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

        return await interaction.respond(filtered.length ? filtered : [{ name: 'No matches found', value: 'none' }]);
      }

      if (focused.name === 'system') {
        const systems = await RatingSystem.find();
        const filtered = systems
          .filter(s => s.name.toLowerCase().includes(focused.value.toLowerCase()))
          .slice(0, 25)
          .map(s => ({ name: s.name, value: s.name }));

        return await interaction.respond(filtered.length ? filtered : [{ name: 'No matches found', value: 'none' }]);
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

// Bot Login
client.login(process.env.TOKEN);
