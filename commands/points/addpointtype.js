const { SlashCommandBuilder } = require('discord.js');
const PointType = require('../../models/PointType');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpointtype')
    .setDescription('Add a new point type for this server')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Name of the point type')
        .setRequired(true)
    ),

  async execute(interaction) {
    const type = interaction.options.getString('type');
    const guildId = interaction.guild.id;

    // Check if this type already exists for the guild
    const existing = await PointType.findOne({ guildId, type });
    if (existing) {
      await interaction.reply({
        content: `⚠️ Point type **${type}** already exists in this server.`,
        ephemeral: true
      });
      return;
    }

    // Create the new point type
    await PointType.create({ guildId, type });

    await interaction.reply({
      content: `✅ Added point type: **${type}**`,
      ephemeral: true
    });
  }
};
