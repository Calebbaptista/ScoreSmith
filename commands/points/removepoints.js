const { SlashCommandBuilder } = require('discord.js');
const Point = require('../../models/Point');
const PointType = require('../../models/PointType');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removepoints')
    .setDescription('Remove a point of a specific type from a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to remove a point from')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of point to remove')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const guildId = interaction.guild.id;

    const point = await Point.findOne({ userId: user.id, guildId, type });

    if (!point) {
      await interaction.reply({ content: `⚠️ No point of type **${type}** found for ${user.username}.`, ephemeral: true });
      return;
    }

    await point.deleteOne();
    await interaction.reply({ content: `🗑️ Removed one **${type}** point from ${user.username}.`, ephemeral: true });
  },

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const guildId = interaction.guild.id;

    const types = await PointType.find({ guildId });
    const filtered = types
      .filter(t => t.name.toLowerCase().includes(focusedValue.toLowerCase()))
      .map(t => ({ name: t.name, value: t.name }));

    await interaction.respond(filtered.slice(0, 25));
  }
};
