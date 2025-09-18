// commands/removepoints.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const Point = require('../models/Point');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removepoints')
    .setDescription('Remove points of a specific type from a user.')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('Member whose points to remove')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Point type to remove')
        .setRequired(true)
        .setAutocomplete(true)),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'type') return;
    const allTypes = await Point.distinct('type', { guildId: interaction.guildId });
    const choices = allTypes
      .filter(t => t.toLowerCase().startsWith(focused.value.toLowerCase()))
      .slice(0, 25)
      .map(t => ({ name: t, value: t }));
    
    await interaction.respond(choices);
  },

  async execute(interaction) {
    const user = interaction.options.getUser('target');
    const type = interaction.options.getString('type');
    // …remove points of this type from user in DB…
    await interaction.reply(`🗑️ Removed all **${type}** points from ${user.tag}.`);
  }
};
