const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const PointType = require('../models/PointType');
const AccessMap = require('../models/AccessMap');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setpointaccess')
    .setDescription('Toggle access to a point type for a specific role')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to grant or revoke access')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Point type to control access for')
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const role = interaction.options.getRole('role');
    const type = interaction.options.getString('type');

    // Check if point type exists
    const pointType = await PointType.findOne({ guildId, type });
    if (!pointType) {
      const notFoundEmbed = new EmbedBuilder()
        .setTitle('❌ Point Type Not Found')
        .setDescription(`The point type **${type}** does not exist in this server.`)
        .setColor(0xFF0000);
      return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
    }

    // Toggle access
    const existing = await AccessMap.findOne({ guildId, roleId: role.id, type });
    let embed;

    if (existing) {
      await AccessMap.deleteOne({ _id: existing._id });
      embed = new EmbedBuilder()
        .setTitle('🔓 Access Revoked')
        .setDescription(`Role <@&${role.id}> can no longer use **${type}**.`)
        .setColor(0xFFA500);
    } else {
      await AccessMap.create({ guildId, roleId: role.id, type });
      embed = new EmbedBuilder()
        .setTitle('🔐 Access Granted')
        .setDescription(`Role <@&${role.id}> can now use **${type}**.`)
        .setColor(0x00BFFF);
    }

    embed.setFooter({ text: `Configured by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
    await interaction.reply({ embeds: [embed] });
  }
};
