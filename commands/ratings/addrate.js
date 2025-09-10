const UserRatings = require('../../models/UserRatings');
const RatingSystem = require('../../models/RatingSystem');

module.exports = async (interaction) => {
  const user = interaction.options.getUser('user');
  const system = interaction.options.getString('system');
  const score = interaction.options.getInteger('score');
  const reason = interaction.options.getString('reason') || '';

  const systemExists = await RatingSystem.findOne({ name: system });
  if (!systemExists) {
    return interaction.reply({ content: '⚠️ Invalid rating system.', ephemeral: true });
  }

  const existing = await UserRatings.findOne({ userId: user.id, system });
  if (existing) {
    existing.score = score;
    existing.reason = reason;
    await existing.save();
  } else {
    await UserRatings.create({ userId: user.id, system, score, reason });
  }

  await interaction.reply({ content: `✅ Rated <@${user.id}> **${score}/10** in **${system}**.`, ephemeral: true });
};
