const PointType = require('../models/PointType');

module.exports = async (interaction) => {
  try {
    const guildId = interaction.guild.id;
    const focused = interaction.options.getFocused(true);

    const pointTypes = await PointType.find({ guildId });

    const choices = pointTypes
      .filter(pt => pt.name.toLowerCase().includes(focused.value.toLowerCase()))
      .map(pt => ({ name: pt.name, value: pt.name }))
      .slice(0, 25);

    if (!interaction.responded) {
      await interaction.respond(choices.length ? choices : [{ name: 'No matches found', value: 'none' }]);
    }
  } catch (err) {
    console.error('❌ Autocomplete error in typeAutocomplete.js:', err);
  }
};
