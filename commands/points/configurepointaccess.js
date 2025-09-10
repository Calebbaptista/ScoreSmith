const { SlashCommandBuilder } = require('discord.js');
const PointAccess = require('../../models/PointAccess');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configurepointaccess')
    .setDescription('Configure who can use point commands')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to grant access')
        .setRequired(true)),
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const guildId = interaction.guild.id;

    await PointAccess.findOneAndUpdate(
      { guildId },
      { $addToSet: { roles: role.id } },
      { upsert: true }
    );

    await interaction.reply({ content: `🔐 Role <@&${role.id}> granted access to point commands.`, flags: 64 });
  }
};
