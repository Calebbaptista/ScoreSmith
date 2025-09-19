// commands/viewprofile.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const Point = require('../models/Point');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewprofile')
    .setDescription('View a user’s point totals.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Member to view')
        .setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('target') || interaction.user;

    const points = await Point.find({ guildId: interaction.guildId, userId: user.id });

    if (!points.length) {
      return interaction.reply({
        content: `📊 ${user.tag} has no points yet.`,
        flags: 1 << 6
      });
    }

    const lines = points.map(p => `• ${p.type}: ${p.amount}`);
    await interaction.reply({
      content: `📊 Profile for **${user.tag}**\n${lines.join('\n')}`,
      flags: 1 << 6
    });
  }
};
