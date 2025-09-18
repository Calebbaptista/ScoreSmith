const { SlashCommandBuilder } = require('discord.js');
const Rating = require('../../models/Rating');
const LoggingConfig = require('../../models/LoggingConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removerating')
    .setDescription('Remove a specific rating from a user')
    .addUserOption(option =>
      option.setName('user').setDescription('User whose rating you want to remove').setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('entry')
        .setDescription('Select the rating entry to remove')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const target = interaction.options.getUser('user');
    const guildId = interaction.guild.id;

    if (!target) {
      return interaction.respond([]);
    }

    const ratings = await Rating.find({ userId: target.id, guildId });
    const choices = ratings
      .map((r, i) => ({
        name: `${i + 1}. ${r.type}: ${r.value} — "${r.reason}"`,
        value: r._id.toString()
      }))
      .slice(0, 25);

    await interaction.respond(choices);
  },

  async execute(interaction) {
    const ratingId = interaction.options.getString('entry');
    const guildId  = interaction.guild.id;

    const rating = await Rating.findOne({ _id: ratingId, guildId });
    if (!rating) {
      return interaction.reply({ content: '⚠️ Rating not found or already removed.', ephemeral: true });
    }

    await Rating.deleteOne({ _id: rating._id });

    await interaction.reply({
      content: `✅ Removed rating → **${rating.type}**: ${rating.value}\n📖 Reason: "${rating.reason}"`,
      ephemeral: false
    });

    const logConfig = await LoggingConfig.findOne({ guildId });
    if (logConfig) {
      const logCh = interaction.guild.channels.cache.get(logConfig.channelId);
      if (logCh) {
        logCh.send(
          `🗑️ ${interaction.user.username} removed a rating from <@${rating.userId}> → ${rating.type}: ${rating.value} — "${rating.reason}"`
        );
      }
    }
  }
};
