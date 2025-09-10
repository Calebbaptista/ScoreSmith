const { SlashCommandBuilder } = require('discord.js');
const Point = require('../../models/Point');
const PointLimit = require('../../models/PointLimit');
const PointType = require('../../models/PointType');
const LoggingConfig = require('../../models/LoggingConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpoints')
    .setDescription('Add points to a user')
    .addUserOption(option =>
      option.setName('user').setDescription('User to award points to').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type').setDescription('Type of point').setRequired(true).setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option.setName('amount').setDescription('Points to add').setRequired(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const guildId = interaction.guild.id;
    const types = await PointType.find({ guildId });

    const filtered = types.map(t => t.type).filter(t => t.toLowerCase().includes(focused.toLowerCase())).slice(0, 25);
    await interaction.respond(filtered.map(t => ({ name: t, value: t })));
  },

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const amount = interaction.options.getInteger('amount');
    const guildId = interaction.guild.id;

    const config = await PointLimit.findOne({ guildId });
    const limit = config?.limit || 10;

    if (amount > limit) {
      await interaction.reply({ content: `⚠️ You can only add up to ${limit} points at a time.`, ephemeral: true });
      return;
    }

    for (let i = 0; i < amount; i++) {
      await Point.create({ userId: user.id, guildId, type });
    }

    await interaction.reply(`✅ Added ${amount} **${type}** point(s) to ${user.username}.`);

    const logConfig = await LoggingConfig.findOne({ guildId });
    if (logConfig) {
      const logChannel = interaction.guild.channels.cache.get(logConfig.channelId);
      if (logChannel) {
        logChannel.send(`📜 ${interaction.user.username} added ${amount} ${type} point(s) to ${user.username}`);
      }
    }
  }
};
