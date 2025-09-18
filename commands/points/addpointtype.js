const { SlashCommandBuilder } = require('discord.js');
const PointType = require('../../models/PointType');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpointtype')
    .setDescription('Add a new point type for this server')
    .addStringOption(option =>
      option.setName('name') // ← matches Discord input
        .setDescription('Name of the point type')
        .setRequired(true)
    ),

  async execute(interaction) {
    const type = interaction.options.getString('name'); // ← updated to match above
    const guildId = interaction.guild.id;

    if (!type) {
      await interaction.reply({
        content: `⚠️ No point type provided.`,
        ephemeral: true
      });
      return;
    }

    const existing = await PointType.findOne({ guildId, type });
    if (existing) {
      await interaction.reply({
        content: `⚠️ Point type **${type}** already exists in this server.`,
        ephemeral: true
      });
      return;
    }

    await PointType.create({ guildId, type });

    await interaction.reply({
      content: `✅ Added point type: **${type}**`,
      ephemeral: true
    });
  }
};
