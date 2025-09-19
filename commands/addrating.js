// commands/addrating.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const Rating = require('../models/Rating');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addrating')
    .setDescription('Add a rating threshold for a point type.')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Point type to attach this rating to')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('min')
        .setDescription('Minimum points required for this rating')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('label')
        .setDescription('The rating label (e.g. Apprentice, Master)')
        .setRequired(true)),

  async execute(interaction) {
    const type  = interaction.options.getString('type').toLowerCase();
    const min   = interaction.options.getInteger('min');
    const label = interaction.options.getString('label');

    await Rating.findOneAndUpdate(
      { guildId: interaction.guildId, type, min },
      { guildId: interaction.guildId, type, min, label },
      { upsert: true, new: true }
    );

    await interaction.reply({
      content: `⭐ Added rating **${label}** for type **${type}** at ${min}+ points.`,
      flags: 1 << 6
    });
  }
};
