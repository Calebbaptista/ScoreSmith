const { SlashCommandBuilder } = require('discord.js');
const Point = require('../../models/Point');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewpoints')
    .setDescription('View a user’s point totals')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to view points for')
        .setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const guildId = interaction.guild.id;

    const points = await Point.find({ userId: user.id, guildId });
    const counts = {};

    for (const point of points) {
      counts[point.type] = (counts[point.type] || 0) + 1;
    }

    const summary = Object.entries(counts)
      .map(([type, count]) => `• **${type}**: ${count}`)
      .join('\n') || 'No points found.';

    await interaction.reply({
      content: `📊 Points for <@${user.id}>:\n${summary}`,
      flags: 64
    });
  }
};
