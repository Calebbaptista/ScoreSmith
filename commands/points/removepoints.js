const { SlashCommandBuilder } = require('discord.js');
const Point = require('../../models/Point');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removepoints')
    .setDescription('Remove multiple points from a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to remove points from')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Point type')
        .setRequired(true)
        .setAutocomplete(true))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of points to remove')
        .setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const amount = interaction.options.getInteger('amount');
    const guildId = interaction.guild.id;

    const result = await Point.deleteMany({ userId: user.id, guildId, type }).limit(amount);

    await interaction.reply({ content: `🗑️ Removed up to **${amount}** ${type} point(s) from <@${user.id}>.`, flags: 64 });
  }
};
