const { SlashCommandBuilder } = require('discord.js');
const Rating = require('../../models/Rating');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removerating')
    .setDescription('Remove a rating from a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to remove rating from')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Rating type')
        .setRequired(true)
        .setAutocomplete(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const guildId = interaction.guild.id;

    const result = await Rating.findOneAndDelete({ userId: user.id, guildId, type });

    if (result) {
      await interaction.reply({ content: `🗑️ Removed one **${type}** rating from <@${user.id}>.`, flags: 64 });
    } else {
      await interaction.reply({ content: `⚠️ No rating of type **${type}** found for <@${user.id}>.`, flags: 64 });
    }
  }
};
