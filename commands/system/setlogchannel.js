const { SlashCommandBuilder } = require('discord.js');
const LogConfig = require('../../models/LogConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlogchannel')
    .setDescription('Set the channel for system logs')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to send logs to')
        .setRequired(true)),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    await LogConfig.findOneAndUpdate(
      { guildId },
      { $set: { channelId: channel.id } },
      { upsert: true }
    );

    await interaction.reply({ content: `📍 Log channel set to <#${channel.id}>.`, flags: 64 });
  }
};
