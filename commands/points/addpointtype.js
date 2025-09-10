const PointType = require('../../models/PointType');

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const name = interaction.options.getString('name');

  const existing = await PointType.findOne({ guildId, name });
  if (existing) {
    return interaction.reply({ content: '⚠️ That point type already exists.', ephemeral: true });
  }

  await PointType.create({ guildId, name });
  await interaction.reply({ content: `✅ Point type **${name}** created.`, ephemeral: true });
};
