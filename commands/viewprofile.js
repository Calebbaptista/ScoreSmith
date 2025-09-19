// commands/viewprofile.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Point = require('../models/Point');
const PointType = require('../models/PointType');
const Rating = require('../models/Rating');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewprofile')
    .setDescription('View a user’s point totals and ratings.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Member to view')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('target') || interaction.user;

    // --- POINTS ---
    const validTypes = await PointType.find({ guildId: interaction.guildId }).distinct('name');
    const points = await Point.find({
      guildId: interaction.guildId,
      userId: user.id,
      type: { $in: validTypes }
    });

    // --- RATINGS ---
    const ratings = await Rating.find({ guildId: interaction.guildId, targetId: user.id });

    const embed = new EmbedBuilder()
      .setTitle(`📊 Profile for ${user.tag}`)
      .setThumbnail(user.displayAvatarURL())
      .setColor(0x3498db)
      .setTimestamp();

    // Points section
    if (!points.length) {
      embed.addFields({ name: 'Points', value: 'No points yet.', inline: false });
    } else {
      let total = 0;
      points.forEach(p => {
        total += p.amount;
        embed.addFields({ name: p.type, value: `${p.amount}`, inline: true });
      });
      embed.addFields({ name: 'Total Points', value: `${total}`, inline: false });
    }

    // Ratings section
    if (!ratings.length) {
      embed.addFields({ name: 'Ratings', value: 'No ratings yet.', inline: false });
    } else {
      const avg = (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1);
      embed.addFields({ name: 'Average Rating', value: `${avg}/10 (${ratings.length} ratings)`, inline: false });

      // Show up to 3 most recent ratings
      ratings.slice(-3).forEach(r => {
        embed.addFields({
          name: `⭐ ${r.rating}/10 from <@${r.raterId}>`,
          value: r.reason
        });
      });
    }

    await interaction.reply({ embeds: [embed], flags: 1 << 6 });
  }
};
