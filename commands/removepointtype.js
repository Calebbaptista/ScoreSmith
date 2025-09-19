// commands/removepointtype.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const PointType = require('../models/PointType');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removepointtype')
    .setDescription('Remove an existing point type from this server.')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('The name of the point type to remove')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'type') return;

    const allTypes = await PointType.find({ guildId: interaction.guildId }).distinct('name');
    const choices = allTypes
      .filter(t => t.toLowerCase().startsWith(focused.value.toLowerCase()))
      .slice(0, 25)
      .map(t => ({ name: t, value: t }));

    await interaction.respond(choices);
  },

  async execute(interaction) {
    const typeName = interaction.options.getString('type').toLowerCase();

    try {
      const result = await PointType.findOneAndDelete({
        guildId: interaction.guildId,
        name: typeName
      });

      if (!result) {
        return interaction.reply({
          content: `⚠️ Point type **${typeName}** was not found in this server.`,
          flags: 1 << 6
        });
      }

      await interaction.reply({
        content: `🗑️ Point type **${typeName}** has been removed.`,
        flags: 1 << 6
      });
    } catch (err) {
      console.error('❌ removepointtype error:', err);
      await interaction.reply({
        content: '🚨 Failed to remove the point type. Please try again later.',
        flags: 1 << 6
      });
    }
  }
};
