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
      option.setName('users')
        .setDescription('Mention one or more users')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of point')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Points to remove per user')
        .setRequired(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const guildId = interaction.guild.id;
    const types = await PointType.find({ guildId });

    const choices = types
      .map(t => t.type)
      .filter(t => t.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 25)
      .map(t => ({ name: t, value: t }));

    await interaction.respond(choices);
  },

  async execute(interaction) {
    const raw = interaction.options.getString('users');
    const type = interaction.options.getString('type');
    const amount = interaction.options.getInteger('amount');
    const guildId = interaction.guild.id;

    const userIds = raw.match(/<@!?(\d+)>/g)?.map(tag => tag.replace(/[<@!>]/g, ''));
    const users = userIds?.map(id => interaction.guild.members.cache.get(id)?.user).filter(Boolean);

    if (!users?.length) {
      await interaction.reply({ content: `⚠️ No valid users mentioned.`, ephemeral: true });
      return;
    }

    const config = await PointLimit.findOne({ guildId });
    const limit = config?.limit || 10;

    if (amount > limit) {
      await interaction.reply({ content: `⚠️ You can only remove up to ${limit} points per user.`, ephemeral: true });
      return;
    }

    const results = [];

    for (const user of users) {
      const points = await Point.find({ userId: user.id, guildId, type }).limit(amount);
      if (!points.length) {
        results.push(`⚠️ No ${type} points found for ${user.username}`);
        continue;
      }

      for (const point of points) {
        await point.deleteOne();
      }

      results.push(`✅ Removed ${points.length} **${type}** point(s) from ${user.username}`);
    }

    await interaction.reply(results.join('\n'));

    const logConfig = await LoggingConfig.findOne({ guildId });
    if (logConfig) {
      const logChannel = interaction.guild.channels.cache.get(logConfig.channelId);
      if (logChannel) {
        for (const user of users) {
          logChannel.send(`📜 ${interaction.user.username} removed ${amount} ${type} point(s) from ${user.username}`);
        }
      }
    }
  }
};
