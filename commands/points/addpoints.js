const { SlashCommandBuilder } = require('discord.js');
const Point = require('../../models/Point');
const PointLimit = require('../../models/PointLimit');
const PointType = require('../../models/PointType');
const LoggingConfig = require('../../models/LoggingConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpoints')
    .setDescription('Add points to one or more users')
    .addStringOption(option =>
      option.setName('users')
        .setDescription('Mention one or more users')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of point')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Points to add per user')
        .setRequired(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const guildId = interaction.guild.id;
    const types = await PointType.find({ guildId });

    const filtered = types.map(t => t.type)
      .filter(t => t.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 25);

    await interaction.respond(filtered.map(t => ({ name: t, value: t })));
  },

  async execute(interaction) {
    const raw = interaction.options.getString('users');
    const type = interaction.options.getString('type');
    const amount = interaction.options.getInteger('amount');
    const guildId = interaction.guild.id;

    const userIds = raw.match(/<@!?(\d+)>/g)?.map(tag => tag.replace(/[<@!>]/g, ''));
    const users = userIds?.map(id => interaction.guild.members.cache.get(id)?.user).filter(Boolean);

    if (!users?.length) {
      await interaction.reply({ content: `⚠️ No valid users mentioned.`, ephemeral: true });
      return;
    }

    const config = await PointLimit.findOne({ guildId });
    const limit = config?.limit || 10;

    if (amount > limit) {
      await interaction.reply({ content: `⚠️ You can only add up to ${limit} points per user.`, ephemeral: true });
      return;
    }

    for (const user of users) {
      for (let i = 0; i < amount; i++) {
        await Point.create({ userId: user.id, guildId, type });
      }
    }

    await interaction.reply(`✅ Added ${amount} **${type}** point(s) to ${users.map(u => u.username).join(', ')}`);

    const logConfig = await LoggingConfig.findOne({ guildId });
    if (logConfig) {
      const logChannel = interaction.guild.channels.cache.get(logConfig.channelId);
      if (logChannel) {
        for (const user of users) {
          logChannel.send(`📜 ${interaction.user.username} added ${amount} ${type} point(s) to ${user.username}`);
        }
      }
    }
  }
};
