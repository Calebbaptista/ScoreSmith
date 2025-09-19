// commands/addpoints.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Point = require('../models/Point');
const PointType = require('../models/PointType');
const GuildConfig = require('../models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpoints')
    .setDescription('Add points of a given type to one or more users.')
    .addStringOption(option =>
      option.setName('targets')
        .setDescription('Mention one or more users (separated by spaces)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of points to add')
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
    const targetsRaw = interaction.options.getString('targets');
    const amount = interaction.options.getInteger('amount');
    const typeRaw = interaction.options.getString('type');

    if (!targetsRaw) {
      return interaction.reply('⚠️ You must mention at least one user.');
    }
    if (!typeRaw) {
      return interaction.reply('⚠️ You must specify a point type.');
    }

    const type = typeRaw.toLowerCase();
    const userIds = [...targetsRaw.matchAll(/<@!?(\d+)>/g)].map(m => m[1]);

    if (!userIds.length) {
      return interaction.reply('⚠️ No valid user mentions found.');
    }

    const typeDoc = await PointType.findOne({ guildId: interaction.guildId, name: type });
    if (!typeDoc) {
      return interaction.reply(`⚠️ Point type **${type}** not found.`);
    }

    const results = [];

    for (const id of userIds) {
      const user = await interaction.client.users.fetch(id);
      let record = await Point.findOneAndUpdate(
        { guildId: interaction.guildId, userId: user.id, type },
        { $inc: { amount } },
        { upsert: true, new: true }
      );

      // enforce limit if set
      if (typeDoc.limit && record.amount > typeDoc.limit) {
        record.amount = typeDoc.limit;
        await record.save();
      }

      results.push(`➕ Added ${amount} **${type}** points to ${user.tag}. New total for ${type}: ${record.amount}`);

      // log to guild's logs channel
      const config = await GuildConfig.findOne({ guildId: interaction.guildId });
      if (config?.logsChannelId) {
        const logChannel = interaction.guild.channels.cache.get(config.logsChannelId);
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setTitle('📥 Points Added')
            .setColor(0x2ecc71)
            .addFields(
              { name: 'User', value: `<@${user.id}>`, inline: true },
              { name: 'Changed By', value: `<@${interaction.user.id}>`, inline: true },
              { name: 'Amount', value: `+${amount} ${type}`, inline: true },
              { name: `New Total for ${type}`, value: `${record.amount}`, inline: true }
            )
            .setTimestamp();
          logChannel.send({ embeds: [embed] });
        }
      }
    }

    await interaction.reply(results.join('\n'));
  }
};
