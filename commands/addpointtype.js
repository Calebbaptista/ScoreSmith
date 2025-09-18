const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const PointType = require('../models/PointType');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpointtype')
    .setDescription('Add a new point type to this server')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Name of the point type')
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const type = interaction.options.getString('type');

    // Check for duplicates
    const existing = await PointType.findOne({ guildId, type });
    if (existing) {
      const duplicateEmbed = new EmbedBuilder()
        .setTitle('⚠️ Point Type Already Exists')
        .setDescription(`The point type **${type}** is already registered in this server.`)
        .setColor(0xFFA500);
      return interaction.reply({ embeds: [duplicateEmbed], ephemeral: true });
    }

    // Create new point type
    await PointType.create({ guildId, type });

    const embed = new EmbedBuilder()
      .setTitle('✨ Point Type Added')
      .setDescription(`Point type **${type}** has been added to this server.`)
      .setColor(0x00BFFF)
      .setFooter({ text: `Added by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

    await interaction.reply({ embeds: [embed] });
  }
};

