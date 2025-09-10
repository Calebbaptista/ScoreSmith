const { SlashCommandBuilder } = require('discord.js');
const Point = require('../../models/Point');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpoints')
    .setDescription('Add points to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to receive points')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of point')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const guildId = interaction.guild.id;

    const point = new Point({
      userId: user.id,
      guildId,
      type
    });

    await point.save();
    await interaction.reply({ content: `✅ Added point of type **${type}** to ${user.username}.`, ephemeral: true });
  },
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const guildId = interaction.guild.id;
    const PointType = require('../../models/PointType');

    const types = await PointType.find({ guildId });
    const filtered = types
      .filter(t => t.name.toLowerCase().includes(focusedValue.toLowerCase()))
      .map(t => ({ name: t.name, value: t.name }));

    await interaction.respond(filtered.slice(0, 25));
  }
};
