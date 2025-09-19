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
        .setRequired(true)),

  async execute(interaction) {
    const limitValue = interaction.options.getInteger('limit');

    await GuildConfig.findOneAndUpdate(
      { guildId: interaction.guildId },
      { $set: { globalPointLimit: limitValue } },
      { upsert: true, new: true }
    );

    await interaction.reply(`✅ Global point limit set to **${limitValue}** for all point types.`);
  }
};
