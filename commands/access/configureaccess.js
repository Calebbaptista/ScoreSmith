const { SlashCommandBuilder } = require('discord.js');
const PointAccess = require('../../models/PointAccess');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configureaccess')
    .setDescription('Grant a role access to point commands')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to grant access')
        .setRequired(true)
    ),
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const guildId = interaction.guild.id;

    let config = await PointAccess.findOne({ guildId });
    if (!config) config = new PointAccess({ guildId, roles: [] });

    if (!config.roles.includes(role.id)) {
      config.roles.push(role.id);
      await config.save();
      await interaction.reply({ content: `✅ Access granted to ${role.name}.`, ephemeral: true });
    } else {
      await interaction.reply({ content: `⚠️ ${role.name} already has access.`, ephemeral: true });
    }
  }
};
