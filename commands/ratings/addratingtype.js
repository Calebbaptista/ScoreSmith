const { SlashCommandBuilder } = require('discord.js');
const RatingType = require('../../models/RatingType');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addratingtype')
    .setDescription('Add a new rating type')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Name of the rating type')
        .setRequired(true)),
  async execute(interaction) {
    const name = interaction.options.getString('name');
    const guildId = interaction.guild.id;

    const existing = await RatingType.findOne({ guildId, name });
    if (existing) {
      await interaction.reply({ content: `⚠️ Rating type **${name}** already exists.`, flags: 64 });
      return;
    }

    await RatingType.create({ guildId, name });
    await interaction.reply({ content: `✅ Rating type **${name}** added.`, flags: 64 });
  }
};
