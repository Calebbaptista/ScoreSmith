const { SlashCommandBuilder } = require('discord.js');
const Point = require('../../models/Point');
const PointType = require('../../models/PointType');
const PointLimit = require('../../models/PointLimit');
const LoggingConfig = require('../../models/LoggingConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removepoints')
    .setDescription('Remove points from one or more users')
    .addStringOption(option =>
      option
        .setName('users')
        .setDescription('Mention one or more users (e.g. @user1 @user2)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Type of point')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Points to remove per user')
        .setRequired(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const guildId = interaction.guild.id;
    const types   = await PointType.find({ guildId });

    const choices = types
      .map(t => t.type)
      .filter(type => type.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 25)
      .map(type => ({ name: type, value: type }));

    await interaction.respond(choices);
  },

  async execute(interaction) {
    const rawMentions = interaction.options.getString('users');
    const pointType   = interaction.options.getString('type');
    const amount      = interaction.options.getInteger('amount');
    const guildId     = interaction.guild.id;

    const userIds = rawMentions
      .match(/<@!?(\d+)>/g)
      ?.map(tag => tag.replace(/[<@!>]/g, ''));

    const users = userIds
      ?.map(id => interaction.guild.members.cache.get(id)?.user)
      .filter(Boolean);

    if (!users?.length) {
      return interaction.reply({ content: '⚠️ No valid users mentioned.', ephemeral: true });
    }

    const config = await PointLimit.findOne({ guildId });
    const limit  = config?.limit ?? 10;
    if (amount > limit) {
      return interaction.reply({
        content: `⚠️ You can only remove up to ${limit} points per user.`,
        ephemeral: true
      });
    }

    const results = [];
    for (const user of users) {
      const points = await Point.find({ userId: user.id, guildId, type: pointType }).limit(amount);
      if (!points.length) {
        results.push(`⚠️ No ${pointType} points found for ${user.username}`);
        continue;
      }
      for (const p of points) {
        await p.deleteOne();
      }
      results.push(`✅ Removed ${points.length} **${pointType}** point(s) from ${user.username}`);
    }

    await interaction.reply({ content: results.join('\n'), ephemeral: false });

    const logConfig = await LoggingConfig.findOne({ guildId });
    if (logConfig) {
      const logCh = interaction.guild.channels.cache.get(logConfig.channelId);
      if (logCh) {
        for (const user of users) {
          logCh.send(
            `📜 ${interaction.user.username} removed ${amount} ${pointType} point(s) from ${user.username}`
          );
        }
      }
    }
  }
};
