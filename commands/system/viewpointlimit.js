const PointLimit = require('../../models/PointLimit');

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const limit = await PointLimit.findOne({ guildId });

  if (!limit) {
    return interaction.reply({
      content: '⚠️ No point limit has been set.',
      ephemeral: true
    });
  }

  await interaction.reply({
    content: `📏 Current point transfer limit is **${limit.maxAmount}**.`,
    ephemeral: true
  });
};
