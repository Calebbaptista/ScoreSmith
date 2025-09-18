// commands/addpoints.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const Point = require('../models/Point');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpoints')
    .setDescription('Award points to a member.')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('Member to award points')
        .setRequired(true))
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Number of points')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Point type')
        .setRequired(true)
        .setAutocomplete(true)),
  
  // Autocomplete handler for the "type" option
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'type') return;
    
    // Fetch distinct types from your DB
    const allTypes = await Point.distinct('type', { guildId: interaction.guildId });
    const choices = allTypes
      .filter(t => t.toLowerCase().startsWith(focused.value.toLowerCase()))
      .slice(0, 25)
      .map(t => ({ name: t, value: t }));
    
    await interaction.respond(choices);
  },

  // Execution logic
  async execute(interaction) {
    const user = interaction.options.getUser('target');
    const amount = interaction.options.getInteger('amount');
    const type = interaction.options.getString('type');
    // …award points in your DB…
    await interaction.reply(`🎖️ Gave ${amount} **${type}** points to ${user.tag}.`);
  }
};
