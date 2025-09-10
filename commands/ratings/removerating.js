const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Rating = require('../../models/Rating');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removerating')
    .setDescription('View and remove a specific rating from a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User whose ratings you want to view')
        .setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const guildId = interaction.guild.id;

    const ratings = await Rating.find({ userId: target.id, guildId });

    if (!ratings.length) {
      await interaction.reply(`⚠️ ${target.username} has no ratings recorded.`);
      return;
    }

    const numberedList = ratings.map((r, i) =>
      `${i + 1}. **${r.type}**: ${r.value} — "${r.reason}"`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`📈 Ratings for ${target.username}`)
      .setDescription(numberedList)
      .setColor(0x3498db);

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });

    // Store ratings temporarily for selection
    interaction.client.tempRatings = interaction.client.tempRatings || {};
    interaction.client.tempRatings[interaction.user.id] = ratings;
  }
};
