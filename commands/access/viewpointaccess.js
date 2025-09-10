const { SlashCommandBuilder } = require('discord.js');
const PointAccess = require('../../models/PointAccess');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewpointaccess')
    .setDescription('View which roles have access to point commands'),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const config = await PointAccess.findOne({ guildId });

    if (!config || config.roles.length === 0) {
      await interaction.reply({ content: '⚠️ No roles have been granted access yet.', ephemeral: true });
      return;
    }

    const roleMentions = config.roles.map(id => `<@&${id}>`).join('\n');
    await interaction.reply({ content: `🔐 Roles with access:\n${roleMentions}`, ephemeral: true });
  }
};
