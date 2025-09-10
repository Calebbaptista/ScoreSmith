const PointType = require('../../models/PointType');

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const name = interaction.options.getString('name');

  const deleted = await PointType.deleteOne({ guildId, name });
  if (deleted.deletedCount === 0) {
    return interaction.reply({ content: '⚠️ No such point type found.', ephemeral: true });
  }

  await interaction.reply({ content: `🗑️ Point type **${name}** removed.`, ephemeral: true });
};
