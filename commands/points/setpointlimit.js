const { SlashCommandBuilder } = require('discord.js');
const PointLimit = require('../../models/PointLimit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setpointlimit')
    .setDescription('Set a daily point limit for a type')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Point type')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Maximum points per day')
        .setRequired(true)),
  async execute(interaction) {
    const type = interaction.options.getString('type');
    const limit = interaction.options.getInteger('limit');
    const guildId = interaction.guild.id;

    await PointLimit.findOneAndUpdate(
      { guildId, type },
      { $set: { limit } },
      { upsert: true }
    );

    await interaction.reply({ content: `📏 Daily limit for **${type}** set to **${limit}**.`, flags: 64 });
  }
};
