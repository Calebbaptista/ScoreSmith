const RatingSystem = require('../../models/RatingSystem');

module.exports = async (interaction) => {
  const name = interaction.options.getString('name');

  const deleted = await RatingSystem.deleteOne({ name });
  if (deleted.deletedCount === 0) {
    return interaction.reply({ content: '⚠️ No such rating system found.', ephemeral: true });
  }

  await interaction.reply({ content: `🗑️ Rating system **${name}** removed.`, ephemeral: true });
};
