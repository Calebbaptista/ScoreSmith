const { SlashCommandBuilder } = require('discord.js');
const PointLimit = require('../../models/PointLimit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setpointlimit')
    .setDescription('Set the max points that can be added or removed at once')
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Maximum points per command')
        .setRequired(true)
    ),
  async execute(interaction) {
    const limit = interaction.options.getInteger('limit');
    const guildId = interaction.guild.id;

    let config = await PointLimit.findOne({ guildId });
    if (!config) {
      config = new PointLimit({ guildId, limit });
    } else {
      config.limit = limit;
    }

    await config.save();

    await interaction.reply({
      content: `✅ Point limit set to ${limit} per command.`,
      flags: 1 << 6
    });
  }
};
