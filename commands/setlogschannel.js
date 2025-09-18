const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlogschannel')
    .setDescription('Set the channel where logs will be sent')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to send logs to')
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const channel = interaction.options.getChannel('channel');

    // Save logs channel to GuildConfig
    await GuildConfig.findOneAndUpdate(
      { guildId },
      { $set: { logsChannelId: channel.id } },
      { upsert: true }
    );

    const embed = new EmbedBuilder()
      .setTitle('📜 Logs Channel Set')
      .setDescription(`Logs will now be sent to <#${channel.id}>.`)
      .setColor(0x00BFFF)
      .setFooter({ text: `Configured by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

    await interaction.reply({ embeds: [embed] });
  }
};
