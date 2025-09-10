const { SlashCommandBuilder } = require('discord.js');
const Point = require('../../models/Point');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpoints')
    .setDescription('Add points to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to award points to')
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
        .setDescription('Number of points to add')
        .setRequired(true)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const amount = interaction.options.getInteger('amount');
    const guildId = interaction.guild.id;

    for (let i = 0; i < amount; i++) {
      await Point.create({ userId: user.id, guildId, type });
    }

    await interaction.reply({
      content: `✅ Added ${amount} **${type}** point(s) to ${user.username}.`,
      flags: 1 << 6
    });
  }
};
