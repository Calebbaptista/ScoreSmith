const RatingSystem = require('../../models/RatingSystem');

module.exports = async (interaction) => {
  const name = interaction.options.getString('name');

  const existing = await RatingSystem.findOne({ name });
  if (existing) {
    return interaction.reply({ content: '⚠️ That rating system already exists.', ephemeral: true });
  }

  await RatingSystem.create({ name });
  await interaction.reply({ content: `✅ Rating system **${name}** created.`, ephemeral: true });
};
