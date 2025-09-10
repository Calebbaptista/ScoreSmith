const { SlashCommandBuilder } = require('discord.js');
const PointAccess = require('../../models/PointAccess');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setpointaccess')
    .setDescription('Set which point types a role can access')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to grant access')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('types')
        .setDescription('Comma-separated list of point types')
        .setRequired(true)
    ),
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const rawTypes = interaction.options.getString('types');
    const types = rawTypes.split(',').map(t => t.trim());
    const guildId = interaction.guild.id;

    let access = await PointAccess.findOne({ guildId, roleId: role.id });
    if (!access) {
      access = new PointAccess({ guildId, roleId: role.id, types });
    } else {
      access.types = types;
    }

    await access.save();

    await interaction.reply(`✅ ${role.name} can now access: ${types.join(', ')}`);
  }
};
