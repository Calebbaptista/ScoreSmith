const { SlashCommandBuilder } = require('discord.js');
const Point = require('../../models/Point');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpoints')
    .setDescription('Add multiple points to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to give points to')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Point type')
        .setRequired(true)
        .setAutocomplete(true))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of points to add')
        .setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const amount = interaction.options.getInteger('amount');
    const guildId = interaction.guild.id;

    const points = Array.from({ length: amount }, () => ({
      userId: user.id,
      guildId,
      type,
      timestamp: new Date()
    }));

    await Point.insertMany(points);

    await interaction.reply({ content: `✅ Added **${amount}** ${type} point(s) to <@${user.id}>.`, flags: 64 });
  }
};
