const UserPoints = require('../../models/UserPoints');
const PointType = require('../../models/PointType');

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const user = interaction.options.getUser('user');
  const type = interaction.options.getString('type');
  const amount = interaction.options.getInteger('amount');

  const typeExists = await PointType.findOne({ guildId, name: type });
  if (!typeExists) {
    return interaction.reply({ content: '⚠️ Invalid point type.', ephemeral: true });
  }

  const current = await UserPoints.findOne({ userId: user.id, guildId, type });
  if (!current) {
    return interaction.reply({ content: `⚠️ <@${user.id}> has no points in ${type}.`, ephemeral: true });
  }

  current.amount = Math.max(0, current.amount - amount);
  await current.save();

  await interaction.reply({ content: `✅ Removed ${amount} ${type} from <@${user.id}>.`, ephemeral: true });
};
