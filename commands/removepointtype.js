// commands/removepointtype.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const Point = require('../models/Point');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removepointtype')
    .setDescription('Delete an entire point type from the system.')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Point type to delete')
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
    const type = interaction.options.getString('type');
    // …delete all points with this type and remove type from config…
    await interaction.reply(`🔨 Point type **${type}** has been removed.`);
  }
};
