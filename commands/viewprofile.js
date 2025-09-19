// commands/viewprofile.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Point = require('../models/Point');
const PointType = require('../models/PointType');
const Rating = require('../models/Rating');

function getRatingLabel(ratings, amount) {
  let chosen = 'Unrated';
  for (const r of ratings.sort((a, b) => b.min - a.min)) {
    if (amount >= r.min) {
      chosen = r.label;
      break;
    }
  }
  return chosen;
}

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

    const validTypes = await PointType.find({ guildId: interaction.guildId }).distinct('name');
    const points = await Point.find({
      guildId: interaction.guildId,
      userId: user.id,
      type: { $in: validTypes }
    });

    const embed = new EmbedBuilder()
      .setTitle(`📊 Profile for ${user.tag}`)
      .setThumbnail(user.displayAvatarURL())
      .setColor(0x3498db)
      .setTimestamp();

    if (!points.length) {
      embed.setDescription('This user has no points yet.');
    } else {
      for (const p of points) {
        const ratings = await Rating.find({ guildId: interaction.guildId, type: p.type });
        const ratingLabel = getRatingLabel(ratings, p.amount);

        embed.addFields({
          name: `${p.type}`,
          value: `${p.amount} points\n⭐ ${ratingLabel}`,
          inline: true
        });
      }
    }

    await interaction.reply({ embeds: [embed], flags: 1 << 6 });
  }
};
