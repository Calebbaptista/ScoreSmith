// commands/setpointaccess.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const PointConfig = require('../models/PointConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setpointaccess')
    .setDescription('Grant a role permission to use a specific point type.')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Point type')
        .setRequired(true)
        .setAutocomplete(true))
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('Role to grant access')
        .setRequired(true)),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'type') return;
    const allTypes = await PointConfig.distinct('type', { guildId: interaction.guildId });
    const choices = allTypes
      .filter(t => t.toLowerCase().startsWith(focused.value.toLowerCase()))
      .slice(0, 25)
      .map(t => ({ name: t, value: t }));
    
    await interaction.respond(choices);
  },

  async execute(interaction) {
    const type = interaction.options.getString('type');
    const role = interaction.options.getRole('role');
    // …upsert PointConfig with { guildId, type, allowedRoles: [role.id] }…
    await interaction.reply(`🔐 Role ${role.name} can now use **${type}** points.`);
  }
};
