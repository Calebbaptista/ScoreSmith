const { SlashCommandBuilder } = require('discord.js');
const PointAccess = require('../../models/PointAccess');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewpointaccess')
    .setDescription('View which roles have access to point commands'),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const access = await PointAccess.findOne({ guildId });

    if (!access || access.roles.length === 0) {
      await interaction.reply({ content: '⚠️ No roles currently have access.', flags: 64 });
      return;
    }

    const roles = access.roles.map(roleId => `<@&${roleId}>`).join('\n');
    await interaction.reply({ content: `🔐 Roles with access:\n${roles}`, flags: 64 });
  }
};
