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
    // 1️⃣ Defer once, ephemerally
    await interaction.deferReply({ ephemeral: true });

    // 2️⃣ Normalize & validate
    const rawType = interaction.options.getString('type')?.trim();
    if (!rawType) {
      return interaction.editReply({
        content: '⚠️ You must provide a non-empty point type name.'
      });
    }
    const name = rawType.toLowerCase();

    // 3️⃣ Upsert on { guildId, name } so name is never null
    try {
      await PointType.findOneAndUpdate(
        { guildId: interaction.guildId, name },
        { $setOnInsert: { name, createdAt: new Date() } },
        { upsert: true }
      );
      return interaction.editReply({
        content: `✨ Point type **${name}** has been registered.`
      });
    } catch (err) {
      console.error('❌ addpointtype error:', err);
      return interaction.editReply({
        content: '🚨 Failed to register the point type. Please try again later.'
      });
    }
  }
};
