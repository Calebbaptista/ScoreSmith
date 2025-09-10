const PointLimit = require('../../models/PointLimit');

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const maxAmount = interaction.options.getInteger('max');

  await PointLimit.findOneAndUpdate(
    { guildId },
    { maxAmount },
    { upsert: true }
  );

  await interaction.reply({ content: `✅ Point transfer limit set to **${maxAmount}**.`, ephemeral: true });
};
