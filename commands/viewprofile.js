// commands/viewprofile.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
    const ratings = await Rating.find({ guildId: interaction.guildId, targetId: user.id }).sort({ createdAt: 1 });

    // Pagination setup
    const pageSize = 3;
    let page = 0;
    const totalPages = Math.max(1, Math.ceil(ratings.length / pageSize));

    const buildEmbed = (pageIndex) => {
      const embed = new EmbedBuilder()
        .setTitle(`📊 Profile for ${user.tag}`)
        .setThumbnail(user.displayAvatarURL())
        .setColor(0x3498db)
        .setTimestamp();

      // Points section (per type only)
      if (!points.length) {
        embed.addFields({ name: 'Points', value: 'No points yet.', inline: false });
      } else {
        points.forEach(p => {
          embed.addFields({
            name: `${p.type}`,
            value: `${p.amount} points`,
            inline: true
          });
        });
      }

      // Ratings section
      if (!ratings.length) {
        embed.addFields({ name: 'Ratings', value: 'No ratings yet.', inline: false });
      } else {
        const avg = (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1);
        embed.addFields({ name: 'Average Rating', value: `${avg}/10 (${ratings.length} ratings)`, inline: false });

        const start = pageIndex * pageSize;
        const slice = ratings.slice(start, start + pageSize);

        slice.forEach(r => {
          embed.addFields({
            name: `⭐ ${r.rating}/10 from <@${r.raterId}>`,
            value: r.reason
          });
        });

        embed.setFooter({ text: `Page ${pageIndex + 1} of ${totalPages}` });
      }

      return embed;
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('⬅️ Prev')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('Next ➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages - 1)
    );

    const message = await interaction.reply({
      embeds: [buildEmbed(page)],
      components: totalPages > 1 ? [row] : [],
      fetchReply: true
    });

    if (totalPages > 1) {
      const collector = message.createMessageComponentCollector({
        time: 60_000, // 1 minute
        filter: i => i.user.id === interaction.user.id
      });

      collector.on('collect', async i => {
        if (i.customId === 'prev' && page > 0) page--;
        if (i.customId === 'next' && page < totalPages - 1) page++;

        const newRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('⬅️ Prev')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next ➡️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1)
        );

        await i.update({ embeds: [buildEmbed(page)], components: [newRow] });
      });

      collector.on('end', async () => {
        await message.edit({ components: [] }).catch(() => {});
      });
    }
  }
};
