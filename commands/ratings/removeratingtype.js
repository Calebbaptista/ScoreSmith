const { SlashCommandBuilder } = require('discord.js');
const RatingType = require('../../models/RatingType');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeratingtype')
    .setDescription('Remove an existing rating type')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Name of the rating type to remove')
        .setRequired(true)),
  async execute(interaction) {
    const name = interaction.options.getString('name');
    const guildId = interaction.guild.id;

    const result = await RatingType.findOneAndDelete({ guildId, name });

    if (result) {
      await interaction.reply({ content: `🗑️ Rating type **${name}** removed.`, flags: 64 });
    } else {
      await interaction.reply({ content: `⚠️ Rating type **${name}** not found.`, flags: 64 });
    }
  }
};
