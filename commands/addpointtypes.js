const { SlashCommandBuilder } = require('discord.js');
const PointType = require('../models/PointType');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpointtype')
    .setDescription('Add a new point type')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Name of the point type')
        .setRequired(true)
    ),

  async execute(interaction) {
    const name = interaction.options.getString('name');
    const guildId = interaction.guild.id;

    const existing = await PointType.findOne({ guildId, name });
    if (existing) {
      return interaction.reply({ content: '⚠️ That point type already exists.', ephemeral: true });
    }

    const newType = new PointType({ guildId, name });
    await newType.save();

    await interaction.reply(`✅ Point type **${name}** added.`);
  }
};
