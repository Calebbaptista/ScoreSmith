const { SlashCommandBuilder } = require('discord.js');
const LoggingConfig = require('../../models/LoggingConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlogchannel')
    .setDescription('Set the logging channel for this server')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to send logs to')
        .setRequired(true)
    ),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    let config = await LoggingConfig.findOne({ guildId });
    if (!config) {
      config = new LoggingConfig({ guildId, channelId: channel.id });
    } else {
      config.channelId = channel.id;
    }

    await config.save();

    await interaction.reply(`✅ Logging channel set to ${channel.name}`);
  }
};
