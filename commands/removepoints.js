// commands/removepoints.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const Point = require('../models/Point');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removepoints')
    .setDescription('Remove a specific number of points of a given type from a user.')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('Member whose points to remove')
        .setRequired(true))
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Number of points to remove')
        .setMinValue(1)
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Point type to remove')
        .setRequired(true)
        .setAutocomplete(true)),

  // Autocomplete for “type”
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'type') return;
    const allTypes = await Point.distinct('type', { guildId: interaction.guildId });
    const choices = allTypes
      .filter(t => t.toLowerCase().startsWith(focused.value.toLowerCase()))
      .slice(0, 25)
      .map(t => ({ name: t, value: t }));
    await interaction.respond(choices);
  },

  // Execution logic
  async execute(interaction) {
    const user   = interaction.options.getUser('target');
    const amount = interaction.options.getInteger('amount');
    const type   = interaction.options.getString('type');

    // Subtract the points (adjust to your storage strategy)
    await Point.findOneAndUpdate(
      { guildId: interaction.guildId, userId: user.id, type },
      { $inc: { amount: -amount } },
      { upsert: true }
    );

    await interaction.reply({
      content: `🗑️ Removed ${amount} **${type}** points from ${user.tag}.`,
      flags: 1 << 6
    });
  }
};
