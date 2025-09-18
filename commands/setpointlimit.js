const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setpointlimit')
    .setDescription('Set the maximum number of points a user can add at once')
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Maximum points allowed per add')
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const limit = interaction.options.getInteger('limit');

    // Upsert limit into GuildConfig
    const config = await GuildConfig.findOneAndUpdate(
      { guildId },
      { $set: { pointLimit: limit } },
      { upsert: true, new: true }
    );

    const embed = new EmbedBuilder()
      .setTitle('🔒 Point Limit Set')
      .setDescription(`Users can now add up to **${limit}** points at once.`)
      .setColor(0x00BFFF)
      .setFooter({ text: `Configured by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

    await interaction.reply({ embeds: [embed] });
  }
};
