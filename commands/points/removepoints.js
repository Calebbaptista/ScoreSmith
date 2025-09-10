const { SlashCommandBuilder } = require('discord.js');
const Point = require('../models/Point');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removepoint')
    .setDescription('Remove a point from a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to remove a point from')
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

    const result = await Point.findOneAndDelete({ userId: user.id, guildId, type });

    if (result) {
      await interaction.reply({ content: `🗑️ Removed one **${type}** point from <@${user.id}>.`, flags: 64 });
    } else {
      await interaction.reply({ content: `⚠️ No point of type **${type}** found for <@${user.id}>.`, flags: 64 });
    }
  }
};
