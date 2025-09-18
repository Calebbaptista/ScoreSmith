const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserProfile = require('../../models/UserProfile');
const PointType = require('../../models/PointType');
const AccessMap = require('../../models/AccessMap');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpoints')
    .setDescription('Add points to a user for a specific type')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to give points to')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of points to add')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Point type')
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const type = interaction.options.getString('type');
    const member = interaction.guild.members.cache.get(interaction.user.id);

    // Validate amount
    if (amount <= 0) {
      const invalidEmbed = new EmbedBuilder()
        .setTitle('❌ Invalid Amount')
        .setDescription('You must add at least 1 point.')
        .setColor(0xFF0000);
      return interaction.reply({ embeds: [invalidEmbed], ephemeral: true });
    }

    // Check point type exists
    const pointType = await PointType.findOne({ guildId, type });
    if (!pointType) {
      const notFoundEmbed = new EmbedBuilder()
        .setTitle('❌ Point Type Not Found')
        .setDescription(`The point type **${type}** does not exist.`)
        .setColor(0xFF0000);
      return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
    }

    // Check access
    const accessRoles = await AccessMap.find({ guildId, type });
    const allowedRoleIds = accessRoles.map(a => a.roleId);
    const hasAccess = allowedRoleIds.length === 0 || member.roles.cache.some(role => allowedRoleIds.includes(role.id));

    if (!hasAccess) {
      const accessEmbed = new EmbedBuilder()
        .setTitle('🔒 Access Denied')
        .setDescription(`You don’t have permission to use the point type **${type}**.`)
        .setColor(0xFF0000);
      return interaction.reply({ embeds: [accessEmbed], ephemeral: true });
    }

    // Check point limit
    const config = await GuildConfig.findOne({ guildId });
    const limit = config?.pointLimit ?? 10;
    if (amount > limit) {
      const limitEmbed = new EmbedBuilder()
        .setTitle('⚠️ Point Limit Exceeded')
        .setDescription(`You can only add up to **${limit}** points at once.`)
        .setColor(0xFFA500);
      return interaction.reply({ embeds: [limitEmbed], ephemeral: true });
    }

    // Update profile
    const profile = await UserProfile.findOneAndUpdate(
      { guildId, userId: user.id },
      { $inc: { points: amount } },
      { upsert: true, new: true }
    );

    const embed = new EmbedBuilder()
      .setTitle('🏆 Points Added')
      .setDescription(`<@${user.id}> has received **${amount}** points for **${type}**.\nNew total: **${profile.points}**`)
      .setColor(0x00BFFF)
      .setFooter({ text: `Given by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

    await interaction.reply({ embeds: [embed] });

    // Log to channel if configured
    if (config?.logsChannelId) {
      const logEmbed = new EmbedBuilder()
        .setTitle('📝 Point Addition Log')
        .addFields(
          { name: 'User', value: `<@${user.id}>`, inline: true },
          { name: 'Given By', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Amount', value: `${amount}`, inline: true },
          { name: 'Type', value: `${type}`, inline: true },
          { name: 'New Total', value: `${profile.points}`, inline: true }
        )
        .setColor(0x00FFAA)
        .setTimestamp();

      const logChannel = interaction.guild.channels.cache.get(config.logsChannelId);
      if (logChannel) logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }
  }
};
