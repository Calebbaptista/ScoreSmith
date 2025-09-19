// commands/setpointlimit.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const GuildConfig = require('../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setpointlimit')
    .setDescription('Set a maximum limit for all point types in this server.')
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Maximum points allowed for any type')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply(); // acknowledge immediately

    try {
      const limitValue = interaction.options.getInteger('limit');

      await GuildConfig.findOneAndUpdate(
        { guildId: interaction.guildId },
        { $set: { globalPointLimit: limitValue } },
        { upsert: true, new: true }
      );

      await interaction.editReply(
        `✅ Global point limit set to **${limitValue}** for all point types.`
      );
    } catch (err) {
      console.error('setpointlimit error:', err);
      await interaction.editReply('🚨 Failed to set global point limit.');
    }
  }
};
