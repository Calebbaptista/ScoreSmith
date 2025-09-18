const { SlashCommandBuilder } = require('discord.js');
const Rating = require('../../models/Rating');
const PointType = require('../../models/PointType');
const LoggingConfig = require('../../models/LoggingConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addrating')
    .setDescription('Add a rating to a user')
    .addUserOption(option =>
      option.setName('user').setDescription('User to rate').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type').setDescription('Type of rating').setRequired(true).setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option.setName('value').setDescription('Rating value (1–10)').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for the rating').setRequired(true)
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
    const user = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const value = interaction.options.getInteger('value');
    const reason = interaction.options.getString('reason');
    const guildId = interaction.guild.id;

    if (value < 1 || value > 10) {
      await interaction.reply({ content: `⚠️ Rating must be between 1 and 10.`, ephemeral: true });
      return;
    }

    await Rating.create({ userId: user.id, guildId, type, value, reason, raterId: interaction.user.id });

    await interaction.reply(`✅ Rated ${user.username} → **${type}**: ${value}\n📖 Reason: "${reason}"`);

    const logConfig = await LoggingConfig.findOne({ guildId });
    if (logConfig) {
      const logChannel = interaction.guild.channels.cache.get(logConfig.channelId);
      if (logChannel) {
        logChannel.send(`📈 ${interaction.user.username} rated ${user.username} → ${type}: ${value} | Reason: "${reason}"`);
      }
    }
  }
};
