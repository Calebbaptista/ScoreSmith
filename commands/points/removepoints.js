const { SlashCommandBuilder } = require('discord.js');
const Point = require('../../models/Point');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removepoints')
    .setDescription('Remove points from a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to remove points from')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of point')
        .setRequired(true)
        .addChoices(
          { name: 'Skill', value: 'Skill' },
          { name: 'Honor', value: 'Honor' },
          { name: 'Wisdom', value: 'Wisdom' },
          { name: 'Valor', value: 'Valor' }
        )
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of points to remove')
        .setRequired(true)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const amount = interaction.options.getInteger('amount');
    const guildId = interaction.guild.id;

    const points = await Point.find({ userId: user.id, guildId, type }).limit(amount);
    if (!points.length) {
      await interaction.reply({
        content: `⚠️ No ${type} points found for ${user.username}.`,
        flags: 1 << 6
      });
      return;
    }

    for (const point of points) {
      await point.deleteOne();
    }

    await interaction.reply({
      content: `✅ Removed ${points.length} **${type}** point(s) from ${user.username}.`,
      flags: 1 << 6
    });
  }
};
