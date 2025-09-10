const UserRatings = require('../../models/UserRatings');
const RatingSystem = require('../../models/RatingSystem');

module.exports = async (interaction) => {
  const user = interaction.options.getUser('user');
  const system = interaction.options.getString('system');

  const systemExists = await RatingSystem.findOne({ name: system });
  if (!systemExists) {
    return interaction.reply({ content: '⚠️ Invalid rating system.', ephemeral: true });
  }

  const deleted = await UserRatings.deleteOne({ userId: user.id, system });
  if (deleted.deletedCount === 0) {
    return interaction.reply({ content: `⚠️ <@${user.id}> has no rating in ${system}.`, ephemeral: true });
  }

  await interaction.reply({ content: `🗑️ Removed rating for <@${user.id}> in **${system}**.`, ephemeral: true });
};
