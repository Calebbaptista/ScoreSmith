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
const RankRequirement = require('./models/RankRequirement');

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

    // /set-rank-requirements
    if (commandName === 'set-rank-requirements') {
      const rank = options.getRole('rank');
      const requiredRoles = ['required1', 'required2', 'required3']
        .map(name => options.getRole(name))
        .filter(role => role);

      if (requiredRoles.length === 0) {
        return await interaction.reply(replyEmbed('⚠️ No Requirements Provided', 'You must specify at least one required role.', 0xFF4500));
      }

      await RankRequirement.findOneAndUpdate(
        { guildId, rankRoleId: rank.id },
        { requiredRoleIds: requiredRoles.map(r => r.id) },
        { upsert: true }
      );

      const mentions = requiredRoles.map(r => `<@&${r.id}>`).join(', ');
      return await interaction.reply(replyEmbed('📜 Rank Requirements Set', `To earn **${rank.name}**, a user must have:\n${mentions}`));
    }

    // Remaining commands: /rank, /rating, /add, /remove, /view-points, /set-log-channel
    // These were already implemented in your previous script and can be appended here.
    // Let me know if you'd like me to regenerate the rest of the logic from that point onward.
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
