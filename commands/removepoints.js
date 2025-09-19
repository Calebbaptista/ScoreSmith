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
    if (!interaction.isAutocomplete()) return;
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'type') return;
    const allTypes = await PointType.find({ guildId: interaction.guildId }).distinct('name');
    const choices = allTypes
      .filter(t => t.toLowerCase().startsWith(focused.value.toLowerCase()))
      .slice(0, 25)
      .map(t => ({ name: t, value: t }));
    return interaction.respond(choices);
  },

  async execute(interaction) {
    await interaction.deferReply(); // acknowledge immediately

    try {
      const user = interaction.options.getUser('target');
      const amount = interaction.options.getInteger('amount');
      const typeRaw = interaction.options.getString('type');

      if (!user) return interaction.editReply('⚠️ You must specify a valid user.');
      if (!typeRaw) return interaction.editReply('⚠️ You must specify a point type.');

      const type = typeRaw.toLowerCase();
      const typeDoc = await PointType.findOne({ guildId: interaction.guildId, name: type });
      if (!typeDoc) return interaction.editReply(`⚠️ Point type **${type}** not found.`);

      const config = await GuildConfig.findOne({ guildId: interaction.guildId });

      // Decrement once
      let record = await Point.findOneAndUpdate(
        { guildId: interaction.guildId, userId: user.id, type },
        { $inc: { amount: -amount } },
        { upsert: true, new: true }
      );

      // Clamp to zero
      if (record.amount < 0) {
        record.amount = 0;
        await record.save();
      }

      const replyMsg = `➖ Removed ${amount} **${type}** points from ${user.tag}. New total: ${record.amount}`;
      await interaction.editReply(replyMsg);

      // Log embed
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
    } catch (err) {
      console.error('removepoints error:', err);
      await interaction.editReply('🚨 Failed to remove points.');
    }
  }
};
