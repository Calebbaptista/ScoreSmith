// commands/setpointlimit.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const PointType = require('../models/PointType');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setpointlimit')
    .setDescription('Set a maximum limit for a point type in this server.')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Point type to set a limit for')
        .setRequired(true)
        .setAutocomplete(true))
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Maximum points allowed for this type')
        .setRequired(true)),

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
    const typeNameRaw = interaction.options.getString('type');
    const limitValue = interaction.options.getInteger('limit');

    if (!typeNameRaw) {
      return interaction.reply('⚠️ You must provide a point type.');
    }

    const typeName = typeNameRaw.toLowerCase();

    const typeDoc = await PointType.findOneAndUpdate(
      { guildId: interaction.guildId, name: typeName },
      { $set: { limit: limitValue } },
      { new: true }
    );

    if (!typeDoc) {
      return interaction.reply(`⚠️ Point type **${typeName}** not found.`);
    }

    await interaction.reply(`✅ Limit for **${typeName}** points set to **${limitValue}**.`);
  }
};
