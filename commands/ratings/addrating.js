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
      option
        .setName('type')
        .setDescription('Type of rating')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option
        .setName('value')
        .setDescription('Rating value (1–10)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for the rating').setRequired(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const guildId = interaction.guild.id;
    const types   = await PointType.find({ guildId });

    const choices = types
      .map(t => t.type)
      .filter(type => type.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 25)
      .map(type => ({ name: type, value: type }));

    await interaction.respond(choices);
  },

  async execute(interaction) {
    const user   = interaction.options.getUser('user');
    const type   = interaction.options.getString('type');
    const value  = interaction.options.getInteger('value');
    const reason = interaction.options.getString('reason');
    const guildId = interaction.guild.id;

    if (value < 1 || value > 10) {
      return interaction.reply({ content: '⚠️ Rating must be between 1 and 10.', ephemeral: true });
    }

    await Rating.create({
      userId: user.id,
      guildId,
      type,
      value,
      reason,
      raterId: interaction.user.id
    });

    await interaction.reply({
      content: `✅ Rated ${user.username} → **${type}**: ${value}\n📖 Reason: "${reason}"`,
      ephemeral: false
    });

    const logConfig = await LoggingConfig.findOne({ guildId });
    if (logConfig) {
      const logCh = interaction.guild.channels.cache.get(logConfig.channelId);
      if (logCh) {
        logCh.send(
          `📈 ${interaction.user.username} rated ${user.username} → ${type}: ${value} | Reason: "${reason}"`
        );
      }
    }
  }
};
