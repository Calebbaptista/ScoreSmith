// commands/addpointtype.js

const { SlashCommandBuilder } = require('@discordjs/builders');
const PointType = require('../models/PointType');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpointtype')
    .setDescription('Register a new point type for this guild.')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('The name of the point type to register')
        .setRequired(true)
    ),

  async execute(interaction) {
    // 1. Normalize and validate the input
    const rawType = interaction.options.getString('type')?.trim();
    if (!rawType) {
      return interaction.reply({
        content: '⚠️ You must provide a non-empty point type name.',
        flags: 1 << 6
      });
    }
    const type = rawType.toLowerCase();

    // 2. Upsert the PointType document (no duplicates, no nulls)
    try {
      await PointType.findOneAndUpdate(
        { guildId: interaction.guildId, type },
        { $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      return interaction.reply({
        content: `✨ Point type **${type}** has been registered.`,
        flags: 1 << 6
      });
    } catch (err) {
      console.error('❌ addpointtype error:', err);
      return interaction.reply({
        content: '🚨 Failed to register the point type. Please try again later.',
        flags: 1 << 6
      });
    }
  }
};
