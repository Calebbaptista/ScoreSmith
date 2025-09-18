// commands/addrating.js
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addrating')
    .setDescription('Add a rating to a member (with reason).')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('Member to rate')
        .setRequired(true))
    .addIntegerOption(option =>
      option
        .setName('rating')
        .setDescription('Numeric rating (e.g., 1–5)')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for this rating')
        .setRequired(true)),
  
  async execute(interaction) {
    const user = interaction.options.getUser('target');
    const rating = interaction.options.getInteger('rating');
    const reason = interaction.options.getString('reason');
    // …save rating + reason to your DB…
    await interaction.reply(`⭐ Added rating **${rating}** for ${user.tag}—Reason: "${reason}"`);
  }
};
