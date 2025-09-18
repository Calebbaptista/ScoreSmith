const { SlashCommandBuilder } = require('discord.js');
const Point = require('../../models/Point');
const PointType = require('../../models/PointType');
const PointLimit = require('../../models/PointLimit');
const LoggingConfig = require('../../models/LoggingConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpoints')
    .setDescription('Add points to one or more users')
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
        .setDescription('Points to add per user')
        .setRequired(true)
    ),

  // Autocomplete handler for `type`
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const guildId = interaction.guild.id;
    const types = await PointType.find({ guildId });

    const choices = types
      .map(t => t.type)
      .filter(type => type.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 25)
      .map(type => ({ name: type, value: type }));

    await interaction.respond(choices);
  },

  // Slash-command execution
  async execute(interaction) {
    const rawMentions = interaction.options.getString('users');
    const pointType   = interaction.options.getString('type');
    const amount      = interaction.options.getInteger('amount');
    const guildId     = interaction.guild.id;

    // Parse user IDs from mentions
    const userIds = rawMentions
      .match(/<@!?(\d+)>/g)
      ?.map(tag => tag.replace(/[<@!>]/g, ''));

    const users = userIds
      ?.map(id => interaction.guild.members.cache.get(id)?.user)
      .filter(Boolean);

    if (!users?.length) {
      return interaction.reply({ content: '⚠️ No valid users mentioned.', ephemeral: true });
    }

    // Check per-guild point limit
    const config = await PointLimit.findOne({ guildId });
    const limit  = config?.limit ?? 10;
    if (amount > limit) {
      return interaction.reply({
        content: `⚠️ You can only add up to ${limit} points per user.`,
        ephemeral: true
      });
    }

    // Create points
    for (const user of users) {
      for (let i = 0; i < amount; i++) {
        await Point.create({ userId: user.id, guildId, type: pointType });
      }
    }

    await interaction.reply({
      content: `✅ Added ${amount} **${pointType}** point(s) to ${users
        .map(u => u.username)
        .join(', ')}`,
      ephemeral: false
    });

    // Logging
    const logConfig = await LoggingConfig.findOne({ guildId });
    if (logConfig) {
      const logCh = interaction.guild.channels.cache.get(logConfig.channelId);
      if (logCh) {
        for (const user of users) {
          logCh.send(
            `📜 ${interaction.user.username} added ${amount} ${pointType} point(s) to ${user.username}`
          );
        }
      }
    }
  }
};
