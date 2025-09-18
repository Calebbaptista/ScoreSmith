// commands/test/autocomplete-test.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autocomplete-test')
    .setDescription('Test autocomplete functionality')
    .addStringOption(option =>
      option
        .setName('foo')
        .setDescription('Type to see suggestions')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    console.log('Test autocomplete focused:', focused);
    const choices = ['Alpha', 'Beta', 'Gamma', 'Delta']
      .filter(c => c.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 25)
      .map(c => ({ name: c, value: c }));

    await interaction.respond(choices);
  },

  async execute(interaction) {
    const foo = interaction.options.getString('foo');
    await interaction.reply(`You chose: ${foo}`);
  }
};
