
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const PointType = require('../../models/PointType');
const AccessMap = require('../../models/AccessMap');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removepointtype')
    .setDescription('Remove a point type and all related data')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('The point type to remove')
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const type = interaction.options.getString('type');

    const pointType = await PointType.findOneAndDelete({ guildId, type });

    if (!pointType) {
      const notFoundEmbed = new EmbedBuilder()
        .setTitle('❌ Point Type Not Found')
        .setDescription(`No point type named **${type}** exists in this server.`)
        .setColor(0xFF0000);
      return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
    }

    // Remove related access mappings
    await AccessMap.deleteMany({ guildId, type });

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Point Type Removed')
      .setDescription(`Point type **${type}** and all related access data have been deleted.`)
      .setColor(0xFF5555)
      .setFooter({ text: `Removed by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

    await interaction.reply({ embeds: [embed] });
  }
};
