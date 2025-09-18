const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autocomplete-test')
    .setDescription('Test autocomplete functionality')
    .addStringOption(option =>
      option.setName('foo')
        .setDescription('Type to see suggestions')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const choices = ['Alpha', 'Beta', 'Gamma', 'Delta']
      .filter(c => c.toLowerCase().includes(focused.toLowerCase()))
      .map(c => ({ name: c, value: c }));
    await interaction.respond(choices);
  },

  async execute(interaction) {
    await interaction.reply(`You chose: ${interaction.options.getString('foo')}`);
  }
};
