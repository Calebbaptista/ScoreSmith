// commands/addrating.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const Rating = require('../models/Rating');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addrating')
    .setDescription('Add a rating (1–10) to a member, with a reason.')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('Member to rate')
        .setRequired(true))
    .addIntegerOption(option =>
      option
        .setName('rating')
        .setDescription('Numeric rating between 1 and 10')
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for this rating')
        .setRequired(true)),

  async execute(interaction) {
    const user   = interaction.options.getUser('target');
    const rating = interaction.options.getInteger('rating');
    const reason = interaction.options.getString('reason').trim();

    await Rating.create({
      guildId: interaction.guildId,
      userId:  user.id,
      rating,
      reason
    });

    await interaction.reply({
      content: `⭐ Added rating **${rating}** (1–10) for ${user.tag} — Reason: "${reason}"`,
      flags: 1 << 6
    });
  }
};
