const UserPoints = require('../../models/UserPoints');
const PointLimit = require('../../models/PointLimit');
const PointType = require('../../models/PointType');

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const user = interaction.options.getUser('user');
  const type = interaction.options.getString('type');
  const amount = interaction.options.getInteger('amount');

  const limit = await PointLimit.findOne({ guildId });
  if (limit && amount > limit.maxAmount) {
    return interaction.reply({ content: `⛔ Max allowed is ${limit.maxAmount}.`, ephemeral: true });
  }

  const typeExists = await PointType.findOne({ guildId, name: type });
  if (!typeExists) {
    return interaction.reply({ content: '⚠️ Invalid point type.', ephemeral: true });
  }

  const current = await UserPoints.findOne({ userId: user.id, guildId, type });
  if (current) {
    current.amount += amount;
    await current.save();
  } else {
    await UserPoints.create({ userId: user.id, guildId, type, amount });
  }

  await interaction.reply({ content: `✅ Added ${amount} ${type} to <@${user.id}>.`, ephemeral: true });
};
