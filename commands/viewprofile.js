// commands/viewprofile.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Point = require('../models/Point');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewprofile')
    .setDescription('View a user’s point totals.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Member to view')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('target') || interaction.user;

    const points = await Point.find({ guildId: interaction.guildId, userId: user.id });

    if (!points.length) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`📊 Profile for ${user.tag}`)
            .setDescription('This user has no points yet.')
            .setColor(0x95a5a6)
            .setThumbnail(user.displayAvatarURL())
        ],
        flags: 1 << 6
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📊 Profile for ${user.tag}`)
      .setThumbnail(user.displayAvatarURL())
      .setColor(0x3498db)
      .setTimestamp();

    points.forEach(p => {
      embed.addFields({ name: p.type, value: `${p.amount}`, inline: true });
    });

    await interaction.reply({ embeds: [embed], flags: 1 << 6 });
  }
};
