const PointAccess = require('../models/PointAccess');

module.exports = async (interaction, type) => {
  const guildId = interaction.guild.id;
  const access = await PointAccess.findOne({ guildId, type });
  if (!access) return true;

  const memberRoles = interaction.member.roles.cache.map(r => r.id);
  return access.allowedRoles.some(roleId => memberRoles.includes(roleId));
};
