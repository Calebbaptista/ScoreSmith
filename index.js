require('dotenv').config();
const { Client, GatewayIntentBits, Events, ComponentType, StringSelectMenuBuilder } = require('discord.js');
const mongoose = require('mongoose');

// Models
const PointType = require('./models/PointType');
const UserPoints = require('./models/UserPoints');
const RatingSystem = require('./models/RatingSystem');
const UserRatings = require('./models/UserRatings');
const LogChannel = require('./models/LogChannel');
const PointAccess = require('./models/PointAccess');

// Discord Client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🟣 Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Error:', err));

client.once(Events.ClientReady, () => {
  console.log(`🛡️ ScoreSmith is online as ${client.user.tag}`);
});

// Utility: Embed Builder
const replyEmbed = (title, description, color = 0x6A0DAD) => ({
  embeds: [{ title, description, color, timestamp: new Date().toISOString() }]
});

// Interaction Handler
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const { commandName, options } = interaction;
    const guildId = interaction.guild.id;
    const user = options.getUser('user');

    // Point Type Management
    if (commandName === 'add-point-type') {
      const name = options.getString('name');
      const exists = await PointType.findOne({ name, guildId });
      if (exists) return await interaction.reply(replyEmbed('⚠️ Already Exists', `Point type **${name}** already exists.`));
      await PointType.create({ name, guildId });
      return await interaction.reply(replyEmbed('✅ Point Type Added', `Created point type **${name}**.`));
    }

    if (commandName === 'remove-point-type') {
      const name = options.getString('name');
      const deleted = await PointType.deleteOne({ name, guildId });
      if (deleted.deletedCount === 0) return await interaction.reply(replyEmbed('⚠️ Not Found', `Point type **${name}** does not exist.`));
      return await interaction.reply(replyEmbed('🗑️ Point Type Removed', `Deleted point type **${name}**.`));
    }

    // Point Transactions
    if (commandName === 'add-points' || commandName === 'remove-points') {
      const type = options.getString('type');
      const amount = options.getInteger('amount');
      const existing = await PointType.findOne({ name: type, guildId });
      if (!existing) return await interaction.reply(replyEmbed('⚠️ Invalid Type', `Point type **${type}** does not exist.`));

      const access = await PointAccess.findOne({ guildId, type });
      const memberRoles = interaction.member.roles.cache.map(r => r.id);
      if (access && !access.allowedRoles.some(roleId => memberRoles.includes(roleId))) {
        return await interaction.reply({ ephemeral: true, content: `⛔ You don’t have permission to manage **${type}** points.` });
      }

      const delta = commandName === 'add-points' ? amount : -amount;
      await UserPoints.findOneAndUpdate(
        { userId: user.id, guildId, type },
        { $inc: { amount: delta } },
        { upsert: true }
      );

      const verb = commandName === 'add-points' ? 'Gave' : 'Removed';
      const symbol = commandName === 'add-points' ? '✅' : '➖';
      return await interaction.reply(replyEmbed(`${symbol} Points ${verb}`, `${verb} **${Math.abs(delta)}** ${type} ${commandName === 'add-points' ? 'to' : 'from'} <@${user.id}>.`));
    }

    // Rating System Management
    if (commandName === 'add-rating-type') {
      const name = options.getString('name');
      const description = options.getString('description') || '';
      const exists = await RatingSystem.findOne({ name });
      if (exists) return await interaction.reply(replyEmbed('⚠️ Already Exists', `Rating system **${name}** already exists.`));
      await RatingSystem.create({ name, description });
      return await interaction.reply(replyEmbed('✅ Rating System Added', `Created rating system **${name}**.`));
    }

    if (commandName === 'remove-rating-type') {
      const name = options.getString('name');
      const deleted = await RatingSystem.deleteOne({ name });
      if (deleted.deletedCount === 0) return await interaction.reply(replyEmbed('⚠️ Not Found', `Rating system **${name}** does not exist.`));
      return await interaction.reply(replyEmbed('🗑️ Rating System Removed', `Deleted rating system **${name}**.`));
    }

    // Rating Transactions
    if (commandName === 'add-rate') {
      const system = options.getString('system');
      const score = options.getInteger('score');
      const reason = options.getString('reason') || 'No reason provided.';
      const exists = await RatingSystem.findOne({ name: system });
      if (!exists) return await interaction.reply(replyEmbed('⚠️ Invalid System', `Rating system **${system}** does not exist.`));
      await UserRatings.findOneAndUpdate(
        { userId: user.id, system },
        { score, reason },
        { upsert: true }
      );
      return await interaction.reply(replyEmbed('✅ Rating Added', `Rated <@${user.id}> **${score}/10** in **${system}**.\nReason: ${reason}`));
    }

    if (commandName === 'remove-rating') {
      const system = options.getString('system');
      const deleted = await UserRatings.deleteOne({ userId: user.id, system });
      if (deleted.deletedCount === 0) return await interaction.reply(replyEmbed('⚠️ Not Found', `<@${user.id}> has no rating in **${system}**.`));
      return await interaction.reply(replyEmbed('🗑️ Rating Removed', `Deleted <@${user.id}>'s rating in **${system}**.`));
    }

    // Profile Viewing
    if (commandName === 'view-profile') {
      const points = await UserPoints.find({ userId: user.id, guildId });
      const ratings = await UserRatings.find({ userId: user.id });

      const pointLines = points.map(p => `• ${p.type}: ${p.amount}`).join('\n') || 'No points recorded.';
      const ratingLines = ratings.map(r => `• ${r.system}: ${r.score}/10 — ${r.reason}`).join('\n') || 'No ratings recorded.';

      return await interaction.reply(replyEmbed(
        `📜 Profile: ${user.username}`,
        `__Points__:\n${pointLines}\n\n__Ratings__:\n${ratingLines}`
      ));
    }

    // Logging Setup
    if (commandName === 'set-log-channel') {
      const channel = options.getChannel('channel');
      await LogChannel.findOneAndUpdate(
        { guildId },
        { channelId: channel.id },
        { upsert: true }
      );
      return await interaction.reply(replyEmbed('📣 Log Channel Set', `Bot actions will now be logged in <#${channel.id}>.`));
    }

    // Role Access Configuration
    if (commandName === 'configure-point-access') {
      const pointTypes = await PointType.find({ guildId });
      const roles = interaction.guild.roles.cache
        .filter(r => !r.managed && r.name !== '@everyone')
        .map(role => ({ label: role.name, value: role.id }));

      if (!pointTypes.length) return await interaction.reply('⚠️ No point types found.');

      await interaction.reply({ content: '🔧 Starting role configuration...', ephemeral: true });

      for (const pt of pointTypes) {
        const chunked = [];
        for (let i = 0; i < roles.length; i += 25) {
          chunked.push(roles.slice(i, i + 25));
        }

        for (let index = 0; index < chunked.length; index++) {
          const dropdown = new StringSelectMenuBuilder()
            .setCustomId(`access-${pt.name}-${index}`)
            .setPlaceholder(`Select roles for ${pt.name} (Page ${index + 1})`)
            .setMinValues(0)
            .setMaxValues(chunked[index].length)
            .addOptions(chunked[index]);

          await interaction.followUp({
            content: `🔹 Roles for **${pt.name}** (Page ${index + 1}):`,
            components: [{ type: 1, components: [dropdown] }],
            ephemeral: true
          });
        }
      }

      const collector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000
      });

      collector.on('collect', async i => {
        const match = i.customId.match(/^access-(.+?)-\d+$/);
        if (!match) return;
        const type = match[1];
        const selectedRoles = i.values;

        const existing = await PointAccess.findOne({ guildId, type });
        const merged = Array.from(new Set([...(existing?.allowedRoles || []), ...selectedRoles]));

        await PointAccess.findOneAndUpdate(
          { guildId, type },
          { allowedRoles: merged },
          { upsert: true }
        );

        await i.reply({ content: `✅ Roles updated for **${type}**.`, ephemeral: true });
      });

      collector.on('end', () => {
        interaction.followUp({ content: '✅ Role configuration complete.', ephemeral: true });
      });
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

client.login(process.env.TOKEN);
