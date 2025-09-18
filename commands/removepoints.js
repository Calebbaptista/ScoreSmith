const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserProfile = require('../models/UserProfile');
const GuildConfig = require('../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removepoints')
    .setDescription('Remove points from a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to remove points from')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of points to remove')
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (amount <= 0) {
      const invalidEmbed = new EmbedBuilder()
        .setTitle('❌ Invalid Amount')
        .setDescription('You must remove at least 1 point.')
        .setColor(0xFF0000);
      return interaction.reply({ embeds: [invalidEmbed], ephemeral: true });
    }

    // Fetch or create user profile
    const profile = await UserProfile.findOneAndUpdate(
      { guildId, userId: user.id },
      { $inc: { points: -amount } },
      { upsert: true, new: true }
    );

    const embed = new EmbedBuilder()
      .setTitle('📉 Points Removed')
      .setDescription(`Removed **${amount}** points from <@${user.id}>.\nNew total: **${profile.points}**`)
      .setColor(0xFF5555)
      .setFooter({ text: `Removed by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

    await interaction.reply({ embeds: [embed] });

    // Log to channel if configured
    const config = await GuildConfig.findOne({ guildId });
    if (config?.logsChannelId) {
      const logEmbed = new EmbedBuilder()
        .setTitle('📝 Point Removal Log')
        .addFields(
          { name: 'User', value: `<@${user.id}>`, inline: true },
          { name: 'Removed By', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Amount', value: `${amount}`, inline: true },
          { name: 'New Total', value: `${profile.points}`, inline: true }
        )
        .setColor(0xFFAA00)
        .setTimestamp();

      const logChannel = interaction.guild.channels.cache.get(config.logsChannelId);
      if (logChannel) logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }
  }
};
