const { SlashCommandBuilder } = require('discord.js');
const Point = require('../models/Point');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpoint')
    .setDescription('Add a point to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to give a point to')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Point type')
        .setRequired(true)
        .setAutocomplete(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const guildId = interaction.guild.id;

    await Point.create({ userId: user.id, guildId, type, timestamp: new Date() });

    await interaction.reply({ content: `✅ Point of type **${type}** added to <@${user.id}>.`, flags: 64 });
  }
};
