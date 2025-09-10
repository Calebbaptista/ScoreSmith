const { SlashCommandBuilder } = require('discord.js');
const Point = require('../../models/Point');
const PointLimit = require('../../models/PointLimit');
const PointType = require('../../models/PointType');
const LoggingConfig = require('../../models/LoggingConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removepoints')
    .setDescription('Remove points from a user')
    .addUserOption(option =>
      option.setName('user').setDescription('User to remove points from').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type').setDescription('Type of point').setRequired(true).setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option.setName('amount').setDescription('Points to remove').setRequired(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const guildId = interaction.guild.id;
    const types = await PointType.find({ guildId });

    const filtered = types.map(t => t.type).filter(t => t.toLowerCase().includes(focused.toLowerCase())).slice(0, 25);
    await interaction.respond(filtered.map(t => ({ name: t, value: t })));
  },

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const amount = interaction.options.getInteger('amount');
    const guildId = interaction.guild.id;

    const config = await PointLimit.findOne({ guildId });
    const limit = config?.limit || 10;

    if (amount > limit) {
      await interaction.reply({ content: `⚠️ You can only remove up to ${limit} points at a time.`, ephemeral: true });
      return;
    }

    const points = await Point.find({ userId: user.id, guildId, type }).limit(amount);
    if (!points.length) {
      await interaction.reply(`⚠️ No ${type} points found for ${user.username}.`);
      return;
    }

    for (const point of points) {
      await point.deleteOne();
    }

    await interaction.reply(`✅ Removed ${points.length} **${type}** point(s) from ${user.username}.`);

    const logConfig = await LoggingConfig.findOne({ guildId });
    if (logConfig) {
      const logChannel = interaction.guild.channels.cache.get(logConfig.channelId);
      if (logChannel) {
        logChannel.send(`📜 ${interaction.user.username} removed ${points.length} ${type} point(s) from ${user.username}`);
      }
    }
  }
};
