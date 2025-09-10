const PointType = require('../../models/PointType');
const PointAccess = require('../../models/PointAccess');

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const types = await PointType.find({ guildId });
  const accessList = await PointAccess.find({ guildId });

  let description = '';

  for (const pt of types) {
    const access = accessList.find(a => a.type === pt.name);
    const roles = access?.allowedRoles || [];
    const roleMentions = roles.length ? roles.map(r => `<@&${r}>`).join(', ') : 'None';
    description += `• **${pt.name}**: ${roleMentions}\n`;
  }

  if (!description) description = '⚠️ No point types or access rules found.';
  await interaction.reply({ content: description, ephemeral: true });
};
