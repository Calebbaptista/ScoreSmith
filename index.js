require('dotenv').config();
const { Client, GatewayIntentBits, Events, StringSelectMenuBuilder } = require('discord.js');
const mongoose = require('mongoose');

// Models
const PointType = require('./models/PointType');
const UserPoints = require('./models/UserPoints');
const RatingSystem = require('./models/RatingSystem');
const UserRatings = require('./models/UserRatings');
const LogChannel = require('./models/LogChannel');
const PointAccess = require('./models/PointAccess');
const PointLimit = require('./models/PointLimit');

// Discord Client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🟣 Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Error:', err));

client.once(Events.ClientReady, () => {
  console.log(`🛡️ ScoreSmith is online as ${client.user.tag}`);
});

// Utility: Embed Builder
const replyEmbed = (title, description, interaction, color = 0x6A0DAD) => ({
  embeds: [{
    title,
    description,
    color,
    timestamp: new Date().toISOString(),
    thumbnail: {
      url: interaction.guild.iconURL({ extension: 'png', size: 128 }) || ''
    },
    footer: {
      text: `By ${interaction.user.tag}`,
      icon_url: interaction.user.displayAvatarURL({ extension: 'png', size: 64 })
    }
  }]
});

// Utility: Logging Function
const sendLog = async (guildId, embed) => {
  try {
    const logConfig = await LogChannel.findOne({ guildId });
    if (!logConfig) return;
    const channel = await client.channels.fetch(logConfig.channelId);
    if (!channel) return;
    await channel.send(embed);
  } catch (err) {
    console.error('❌ Logging error:', err);
  }
};

// Interaction Handler
client.on(Events.InteractionCreate, async interaction => {
  const guildId = interaction.guild?.id;

  if (interaction.isChatInputCommand()) {
    try {
      const { commandName, options } = interaction;
      const user = options.getUser?.('user');

      if (commandName === 'add-point-type') {
        const name = options.getString('name');
        const exists = await PointType.findOne({ name, guildId });
        if (exists) return await interaction.reply(replyEmbed('⚠️ Already Exists', `Point type **${name}** already exists.`, interaction));
        await PointType.create({ name, guildId });
        await interaction.reply(replyEmbed('✅ Point Type Added', `Created point type **${name}**.`, interaction));
        await sendLog(guildId, replyEmbed('✅ Point Type Added', `Created point type **${name}**.`, interaction));
      }

      if (commandName === 'remove-point-type') {
        const name = options.getString('name');
        const deleted = await PointType.deleteOne({ name, guildId });
        if (deleted.deletedCount === 0) return await interaction.reply(replyEmbed('⚠️ Not Found', `Point type **${name}** does not exist.`, interaction));
        await interaction.reply(replyEmbed('🗑️ Point Type Removed', `Deleted point type **${name}**.`, interaction));
        await sendLog(guildId, replyEmbed('🗑️ Point Type Removed', `Deleted point type **${name}**.`, interaction));
      }

      if (commandName === 'add-points') {
        const type = options.getString('type');
        const amount = options.getInteger('amount');
        const existing = await PointType.findOne({ name: type, guildId });
        if (!existing) return await interaction.reply(replyEmbed('⚠️ Invalid Type', `Point type **${type}** does not exist.`, interaction));

        const access = await PointAccess.findOne({ guildId, type });
        const memberRoles = interaction.member.roles.cache.map(r => r.id);
        if (access && !access.allowedRoles.some(roleId => memberRoles.includes(roleId))) {
          return await interaction.reply({ content: `⛔ You don’t have permission to manage **${type}** points.`, flags: 64 });
        }

        const limit = await PointLimit.findOne({ guildId });
        if (limit && amount > limit.maxAmount) {
          return await interaction.reply({ content: `⛔ You can’t give more than **${limit.maxAmount}** points at once.`, flags: 64 });
        }

        await UserPoints.findOneAndUpdate(
          { userId: user.id, guildId, type },
          { $inc: { amount } },
          { upsert: true }
        );

        const message = `Gave **${amount}** ${type} to <@${user.id}>.`;
        await interaction.reply(replyEmbed('✅ Points Given', message, interaction));
        await sendLog(guildId, replyEmbed('✅ Points Given', message, interaction));
      }

      if (commandName === 'remove-points') {
        const type = options.getString('type');
        const amount = options.getInteger('amount');
        const existing = await PointType.findOne({ name: type, guildId });
        if (!existing) return await interaction.reply(replyEmbed('⚠️ Invalid Type', `Point type **${type}** does not exist.`, interaction));

        const access = await PointAccess.findOne({ guildId, type });
        const memberRoles = interaction.member.roles.cache.map(r => r.id);
        if (access && !access.allowedRoles.some(roleId => memberRoles.includes(roleId))) {
          return await interaction.reply({ content: `⛔ You don’t have permission to manage **${type}** points.`, flags: 64 });
        }

        const current = await UserPoints.findOne({ userId: user.id, guildId, type });
        const currentAmount = current?.amount || 0;
        const newAmount = Math.max(0, currentAmount - amount);

        await UserPoints.findOneAndUpdate(
          { userId: user.id, guildId, type },
          { amount: newAmount },
          { upsert: true }
        );

        const message = `Removed **${amount}** ${type} from <@${user.id}>. New total: **${newAmount}**.`;
        await interaction.reply(replyEmbed('➖ Points Removed', message, interaction));
        await sendLog(guildId, replyEmbed('➖ Points Removed', message, interaction));
      }

      if (commandName === 'set-point-limit') {
        const amount = options.getInteger('amount');
        const ownerId = interaction.guild.ownerId;
        if (interaction.user.id !== ownerId) {
          return await interaction.reply({ content: '⛔ Only the server owner can set point limits.', flags: 64 });
        }

        await PointLimit.findOneAndUpdate(
          { guildId },
          { maxAmount: amount },
          { upsert: true }
        );

        await interaction.reply(replyEmbed('🔒 Point Limit Set', `Max point transfer set to **${amount}**.`, interaction));
        await sendLog(guildId, replyEmbed('🔒 Point Limit Set', `Max point transfer set to **${amount}**.`, interaction));
      }

      if (commandName === 'set-log-channel') {
        const channel = options.getChannel('channel');
        await LogChannel.findOneAndUpdate(
          { guildId },
          { channelId: channel.id },
          { upsert: true }
        );
        await interaction.reply(replyEmbed('📣 Log Channel Set', `Bot actions will now be logged in <#${channel.id}>.`, interaction));
      }

      // Add remaining commands here (ratings, profile, access config, etc.)
    } catch (err) {
      console.error('❌ Command error:', err);
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({ content: '⚠️ Something went wrong while processing your command.', flags: 64 });
        } catch (e) {
          console.error('⚠️ Failed to reply in catch block:', e);
        }
      }
    }
  }

  if (interaction.isAutocomplete()) {
    const focused = interaction.options.getFocused(true);
    const guildId = interaction.guild.id;

    try {
      let choices = [];

      if (focused.name === 'type') {
        const pointTypes = await PointType.find({ guildId });
        choices = pointTypes.map(pt => ({ name: pt.name, value: pt.name }));
      }

      if (focused.name === 'system') {
        const systems = await RatingSystem.find();
        choices = systems.map(s => ({ name: s.name, value: s.name }));
      }

      const filtered = choices
        .filter(c => c.name.toLowerCase().includes(focused.value.toLowerCase()))
        .slice(0, 25);

      await interaction.respond(filtered.length ? filtered : [{ name: 'No matches found', value: 'none' }]);
    } catch (err) {
      console.error('❌ Autocomplete error:', err);
      // Do not call interaction.respond again here—Discord only allows one response
    }
  }
});

client.login(process.env.TOKEN);
