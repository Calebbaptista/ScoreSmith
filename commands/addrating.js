// commands/addrating.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Rating = require('../models/Rating');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addrating')
    .setDescription('Give a user a rating (1–10) with a reason.')
    .addUserOption(option =>
      option.setName('target') // renamed to target for clarity
        .setDescription('The user you are rating')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('rating')
        .setDescription('Rating from 1 to 10')
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for this rating')
        .setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const ratingValue = interaction.options.getInteger('rating');
    const reason = interaction.options.getString('reason');

    if (!target) {
      return interaction.reply('⚠️ You must specify a valid user to rate.');
    }

    try {
      await Rating.findOneAndUpdate(
        { guildId: interaction.guildId, targetId: target.id, raterId: interaction.user.id },
        { guildId: interaction.guildId, targetId: target.id, raterId: interaction.user.id, rating: ratingValue, reason },
        { upsert: true, new: true, runValidators: true }
      );

      const embed = new EmbedBuilder()
        .setTitle('⭐ New Rating')
        .setColor(0xf1c40f)
        .addFields(
          { name: 'Rated User', value: `<@${target.id}>`, inline: true },
          { name: 'Rater', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Rating', value: `${ratingValue}/10`, inline: true },
          { name: 'Reason', value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('❌ addrating error:', err);
      await interaction.reply('🚨 Failed to add rating. Please check your input.');
    }
  }
};
