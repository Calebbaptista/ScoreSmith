const { SlashCommandBuilder } = require('discord.js');
const Rating = require('../../models/Rating');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addrate')
    .setDescription('Add a rating to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to rate')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Rating type')
        .setRequired(true)
        .setAutocomplete(true))
    .addIntegerOption(option =>
      option.setName('value')
        .setDescription('Rating value')
        .setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const value = interaction.options.getInteger('value');
    const guildId = interaction.guild.id;

    await Rating.create({ userId: user.id, guildId, type, value, timestamp: new Date() });

    await interaction.reply({ content: `✅ Rated <@${user.id}> with **${value}** in **${type}**.`, flags: 64 });
  }
};
