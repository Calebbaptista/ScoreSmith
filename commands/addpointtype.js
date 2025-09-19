// commands/addpointtype.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const PointType = require('../models/PointType');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpointtype')
    .setDescription('Register a new point type for this server.')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('The name of the point type')
        .setRequired(true)
    ),

  async execute(interaction) {
    const typeName = interaction.options.getString('type').toLowerCase();

    try {
      await PointType.findOneAndUpdate(
        { guildId: interaction.guildId, name: typeName },
        { guildId: interaction.guildId, name: typeName },
        { upsert: true, new: true }
      );

      await interaction.reply({
        content: `✨ Point type **${typeName}** has been registered.`,
      });
    } catch (err) {
      if (err.code === 11000) {
        return interaction.reply({
          content: `⚠️ Point type **${typeName}** already exists in this server.`,
          flags: 1 << 6
        });
      }
      console.error('❌ addpointtype error:', err);
      await interaction.reply({
        content: '🚨 Failed to register the point type. Please try again later.',
        flags: 1 << 6
      });
    }
  }
};
