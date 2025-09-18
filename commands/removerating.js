const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Rating = require('../models/Rating');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removerating')
    .setDescription('Remove a rating from a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to remove the rating from')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('rating')
        .setDescription('The rating to remove')
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const user = interaction.options.getUser('user');
    const rating = interaction.options.getString('rating');

    const result = await Rating.findOneAndDelete({
      guildId,
      userId: user.id,
      rating,
      givenBy: interaction.user.id
    });

    const embed = new EmbedBuilder()
      .setColor(result ? 0xFF5555 : 0xAAAAAA)
      .setTitle(result ? '🗑️ Rating Removed' : '❌ Rating Not Found')
      .setDescription(result
        ? `Removed **${rating}** from <@${user.id}>.`
        : `No rating **${rating}** found for <@${user.id}> from you.`)
      .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

    await interaction.reply({ embeds: [embed] });
  }
};
