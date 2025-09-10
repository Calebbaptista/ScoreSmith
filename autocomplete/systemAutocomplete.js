const RatingSystem = require('../models/RatingSystem');

module.exports = async (interaction) => {
  const focused = interaction.options.getFocused(true);

  const systems = await RatingSystem.find();
  const choices = systems
    .filter(s => s.name.toLowerCase().includes(focused.value.toLowerCase()))
    .map(s => ({ name: s.name, value: s.name }))
    .slice(0, 25);

  await interaction.respond(choices.length ? choices : [{ name: 'No matches found', value: 'none' }]);
};
