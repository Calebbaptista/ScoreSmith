// commands/removepoints.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Point = require('../models/Point');
const PointType = require('../models/PointType');
const GuildConfig = require('../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removepoints')
    .setDescription('Remove points of a given type from a user.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Member to remove points from')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of points to remove')
        .setMinValue(1)
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Point type')
        .setRequired(true)
        .setAutocomplete(true)),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'type') return;

    const allTypes = await PointType.find({ guildId: interaction.guildId }).distinct('name');
    const choices = allTypes
      .filter(t => t.toLowerCase().startsWith(focused.value.toLowerCase()))
      .slice(0, 25)
      .map(t => ({ name: t, value: t }));

    await interaction.respond(choices);
  },

  async execute(interaction) {
    const user   = interaction.options.getUser('target');
    const amount = interaction.options.getInteger('amount');
    const type   = interaction.options.getString('type').toLowerCase();

    let record = await Point.findOneAndUpdate(
      { guildId: interaction.guildId, userId: user.id, type },
      { $inc: { amount: -amount } },
      { upsert: true, new: true }
    );

    if (record.amount < 0) {
      record.amount = 0;
      await record.save();
    }

    await interaction.reply({
      content: `➖ Removed ${amount} **${type}** points from ${user.tag}. Total: ${record.amount}`,
    });

    // 🔔 Log to guild's logs channel
    const config = await GuildConfig.findOne({ guildId: interaction.guildId });
    if (config?.logsChannelId) {
      const logChannel = interaction.guild.channels.cache.get(config.logsChannelId);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('📤 Points Removed')
          .setColor(0xe74c3c)
          .addFields(
            { name: 'User', value: `<@${user.id}>`, inline: true },
            { name: 'Changed By', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Amount', value: `-${amount} ${type}`, inline: true },
            { name: 'New Total', value: `${record.amount}`, inline: true }
          )
          .setTimestamp();

        logChannel.send({ embeds: [embed] });
      }
    }
  }
};
