const { SlashCommandBuilder } = require('discord.js');
const PointType = require('../../models/PointType');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removepointtype')
    .setDescription('Remove an existing point type')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Name of the point type to remove')
        .setRequired(true)),
  async execute(interaction) {
    const name = interaction.options.getString('name');
    const guildId = interaction.guild.id;

    const result = await PointType.findOneAndDelete({ guildId, name });

    if (result) {
      await interaction.reply({ content: `🗑️ Point type **${name}** removed.`, flags: 64 });
    } else {
      await interaction.reply({ content: `⚠️ Point type **${name}** not found.`, flags: 64 });
    }
  }
};
