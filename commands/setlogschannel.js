const { SlashCommandBuilder } = require('@discordjs/builders');
const GuildConfig = require('../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlogschannel')
    .setDescription('Set the channel where point logs will be sent.')
    .addChannelOption(option =>
      option.setName('channel').setDescription('The channel to use for logs').setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');

    await GuildConfig.findOneAndUpdate(
      { guildId: interaction.guildId },
      { guildId: interaction.guildId, logsChannelId: channel.id },
      { upsert: true, new: true }
    );

    await interaction.reply(`✅ Logs channel set to ${channel}.`);
  }
};
