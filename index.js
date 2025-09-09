require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const mongoose = require('mongoose');

// Models
const PointType = require('./models/PointType');
const UserPoints = require('./models/UserPoints');
const RatingSystem = require('./models/RatingSystem');
const UserRatings = require('./models/UserRatings');
const LogChannel = require('./models/LogChannel');
const AccessControl = require('./models/AccessControl');
const MainRole = require('./models/MainRole');
const MedalRole = require('./models/MedalRole');

// Discord Client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🟣 Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Bot Ready
client.once(Events.ClientReady, () => {
  console.log(`🛡️ ScoreSmith is online as ${client.user.tag}`);
});

// Utility: Embed Builder
const replyEmbed = (title, description, color = 0x6A0DAD) => ({
  embeds: [{ title, description, color, timestamp: new Date().toISOString() }]
});

// Access Check
const hasAccess = async (guildId, member, category, action) => {
  const access = await AccessControl.findOne({ guildId, category, action });
  return access?.allowedRoleIds?.some(id => member.roles.cache.has(id));
};

// Interaction Handler
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const { commandName, options } = interaction;
    const guildId = interaction.guild.id;
    const member = await interaction.guild.members.fetch(interaction.user.id);

    // /setup-server
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

      const accessMap = [
        { category: 'points', action: 'add', option: 'points-add' },
        { category: 'points', action: 'remove', option: 'points-remove' },
        { category: 'ratings', action: 'rate', option: 'ratings-rate' },
        { category: 'ratings', action: 'delete', option: 'ratings-delete' }
      ];

      const configured = [];

      for (const { category, action, option } of accessMap) {
        const role = options.getRole(option);
        if (role) {
          await AccessControl.findOneAndUpdate(
            { guildId, category, action },
            { allowedRoleIds: [role.id] },
            { upsert: true }
          );
          configured.push(`• ${action} (${category}): <@&${role.id}>`);
        }
      }

      const description = [
        `Default point types and rating systems have been created.`,
        configured.length ? `\n__Access Roles Configured__:\n${configured.join('\n')}` : '',
        `\nRun **/set-log-channel** to enable ceremonial logging.`
      ].join('\n');

      return await interaction.reply(replyEmbed('🏛️ Server Initialized', description));
    }

    // /update-access
    if (commandName === 'update-access') {
      const category = options.getString('category');
      const action = options.getString('action');
      const roles = ['role1', 'role2', 'role3']
        .map(name => options.getRole(name))
        .filter(role => role);

      if (roles.length === 0)
        return await interaction.reply(replyEmbed('⚠️ No Roles Provided', 'You must specify at least one role.', 0xFF4500));

      await AccessControl.findOneAndUpdate(
        { guildId, category, action },
        { allowedRoleIds: roles.map(r => r.id) },
        { upsert: true }
      );

      const mentions = roles.map(r => `<@&${r.id}>`).join(', ');
      return await interaction.reply(replyEmbed('🔐 Access Updated', `**${action}** access for **${category}** is now restricted to: ${mentions}`));
    }

    // /configure-role
    if (commandName === 'configure-role') {
      const role = options.getRole('role');
      const type = options.getString('type'); // 'main' or 'medal'
      const action = options.getString('action'); // 'add' or 'remove'

      const Model = type === 'main' ? MainRole : MedalRole;

      if (action === 'add') {
        await Model.findOneAndUpdate(
          { guildId, roleId: role.id },
          { roleId: role.id },
          { upsert: true }
        );
        return await interaction.reply(replyEmbed('✅ Role Classified', `<@&${role.id}> is now a **${type}** role.`));
      }

      if (action === 'remove') {
        await Model.deleteOne({ guildId, roleId: role.id });
        return await interaction.reply(replyEmbed('🗑️ Role Unclassified', `<@&${role.id}> is no longer a **${type}** role.`));
      }
    }

    // /rank
    if (commandName === 'rank') {
      const action = options.getString('action');
      const user = options.getUser('user');
      const target = await interaction.guild.members.fetch(user.id);

      if (action === 'preview') {
        const pointRecord = await UserPoints.findOne({ userId: user.id });
        const ratingRecord = await UserRatings.findOne({ userId: user.id });

        const validTypes = await PointType.find({ guildId });
        const validTypeNames = validTypes.map(t => t.name);

        const pointLines = (pointRecord?.points || [])
          .filter(p => validTypeNames.includes(p.typeName))
          .map(p => `• ${p.typeName}: ${p.value}`);

        const ratingLines = (ratingRecord?.ratings || [])
          .map(r => `• ${r.systemName}: ${r.score}/10\n  Reason: ${r.reason}`);

        const mainRoles = await MainRole.find({ guildId });
        const medalRoles = await MedalRole.find({ guildId });

        const rank = target.roles.cache.find(r => mainRoles.some(m => m.roleId === r.id));
        const medals = target.roles.cache
          .filter(r => medalRoles.some(m => m.roleId === r.id))
          .map(r => `🏅 ${r.name}`);

        const description = [
          `**Ceremonial Status for <@${user.id}>**`,
          rank ? `__Rank__: **${rank.name}**` : 'No rank assigned.',
          medals.length ? `__Medals__:\n${medals.join('\n')}` : 'No medals earned.',
          pointLines.length ? `\n__Points__:\n${pointLines.join('\n')}` : '',
          ratingLines.length ? `\n__Ratings__:\n${ratingLines.join('\n')}` : ''
        ].join('\n');

        return await interaction.reply(replyEmbed('📜 Rank Preview', description));
      }

      if (action === 'promote') {
        const role = options.getRole('role');
        const requiredRoles = {
          'Grade 1': ['Skill 4', 'Mentor 4'],
          'Grade 2': ['Skill 3', 'Mentor 3'],
          'Grade 3': ['Skill 2', 'Mentor 2'],
          'Grade 4': ['Skill 1', 'Mentor 1']
        }[role.name];

        if (!requiredRoles)
          return await interaction.reply(replyEmbed('⚠️ Unknown Rank', `No requirements defined for **${role.name}**.`, 0xFF4500));

        const userRoleNames = target.roles.cache.map(r => r.name);
        const hasAll = requiredRoles.every(req => userRoleNames.includes(req));

        if (!hasAll) {
          const missing = requiredRoles.filter(req => !userRoleNames.includes(req));
          return await interaction.reply(replyEmbed('⛔ Promotion Denied', `<@${user.id}> is missing:\n${missing.map(m => `• ${m}`).join('\n')}`, 0xFF0000));
        }

        await target.roles.add(role);
        return await interaction.reply(replyEmbed(
          '🏅 Promotion Granted',
          `<@${user.id}> has been promoted to **${role.name}**.`,
          0x32CD32
        ));
      }
    }

    // /rating
    if (commandName === 'rating') {
      const action = options.getString('action');
      const user = options.getUser('user');
      const system = options.getString('system');
      const score = options.getInteger('score');
      const reason = options.getString('reason') || '';

      const target = await interaction.guild.members.fetch(user.id);

      if (action === 'rate') {
        if (!reason.trim()) {
          return await interaction.reply(replyEmbed(
            '⚠️ Reason Required',
            'You must provide a reason when rating a user.',
            0xFF4500
          ));
        }

        const hasPermission = await hasAccess(guildId, member, 'ratings', 'rate');
        if (!hasPermission) {
          return await interaction.reply(replyEmbed(
            '⛔ Access Denied',
            'You lack permission to rate users.',
            0xFF0000
          ));
        }

        const systemData = await RatingSystem.findOne({ name: system });
        if (!systemData) {
          return await interaction.reply(replyEmbed(
            '❌ System Not Found',
            `Rating system **${system}** does not exist.`,
            0xFF0000
          ));
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
        return await interaction.reply(replyEmbed(
          '🏅 Rating Submitted',
          `Rated <@${user.id}> **${score}/10** in **${system}**.\n📜 Reason: ${reason}`
        ));
      }

      if (action === 'view') {
        const record = await UserRatings.findOne({ userId: user.id });
        const rating = record?.ratings.find(r => r.systemName === system);

        if (!rating) {
          return await interaction.reply(replyEmbed(
            '📜 No Rating Found',
            `<@${user.id}> has no rating in **${system}**.`
          ));
        }

        return await interaction.reply(replyEmbed(
          '📊 Rating Preview',
          `<@${user.id}> is rated **${rating.score}/10** in **${system}**.\n📖 Reason: ${rating.reason}`
        ));
      }

      if (action === 'delete') {
        const hasPermission = await hasAccess(guildId, member, 'ratings', 'delete');
        if (!hasPermission) {
          return await interaction.reply(replyEmbed(
            '⛔ Access Denied',
            'You lack permission to delete ratings.',
            0xFF0000
          ));
        }

        const record = await UserRatings.findOne({ userId: user.id });
        const rating = record?.ratings.find(r => r.systemName === system);

        if (!rating) {
          return await interaction.reply(replyEmbed(
            '📜 No Rating Found',
            `<@${user.id}> has no rating in **${system}**.`
          ));
        }

        record.ratings = record.ratings.filter(r => r.systemName !== system);
        await record.save();

        return await interaction.reply(replyEmbed(
          '🗑️ Rating Deleted',
          `Deleted **${system}** rating for <@${user.id}>.\nPrevious score: **${rating.score}/10**\nReason: ${rating.reason}`
        ));
      }
    }

    // /add and /remove points
    if (commandName === 'add' || commandName === 'remove') {
      const category = 'points';
      const action = commandName;
      const hasPermission = await hasAccess(guildId, member, category, action);

      if (!hasPermission) {
        return await interaction.reply(replyEmbed(
          '⛔ Access Denied',
          `You lack permission to ${action} points.`,
          0xFF0000
        ));
      }

      const user = options.getUser('user');
      const type = options.getString('type');
      const amount = options.getInteger('amount');
      const isAdd = commandName === 'add';

      const typeData = await PointType.findOne({ name: type, guildId });
      if (!typeData) {
        return await interaction.reply(replyEmbed(
          '❌ Invalid Type',
          `Point type **${type}** does not exist.`,
          0xFF0000
        ));
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

    // /view-points
    if (commandName === 'view-points') {
      const user = options.getUser('user');
      const record = await UserPoints.findOne({ userId: user.id });
      if (!record || record.points.length === 0) {
        return await interaction.reply(replyEmbed(
          '📊 No Points',
          `<@${user.id}> has no points.`
        ));
      }

      const validTypes = await PointType.find({ guildId });
      const typeNames = validTypes.map(t => t.name);

      const lines = record.points
        .filter(p => typeNames.includes(p.typeName))
        .map(p => `• ${p.typeName}: ${p.value}`);

      return await interaction.reply(replyEmbed(
        '📊 Point Totals',
        `Points for <@${user.id}>:\n${lines.join('\n')}`
      ));
    }

    // /set-log-channel
    if (commandName === 'set-log-channel') {
      const channel = options.getChannel('channel');
      await LogChannel.findOneAndUpdate(
        { guildId },
        { channelId: channel.id },
        { upsert: true }
      );
      return await interaction.reply(replyEmbed(
        '📣 Log Channel Set',
        `Logs will be sent to <#${channel.id}>.`
      ));
    }
  }

  // Autocomplete Handler
  if (interaction.isAutocomplete()) {
    const focused = interaction.options.getFocused(true);
    const guildId = interaction.guild.id;

    try {
      if (focused.name === 'type') {
        const pointTypes = await PointType.find({ guildId });
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
