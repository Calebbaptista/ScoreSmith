const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const UserProfile = require('../models/UserProfile');
const Rating = require('../models/Rating');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewprofile')
    .setDescription('View a user’s points and ratings')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to view')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const guildId = interaction.guild.id;
    const userId = target.id;

    // Fetch points
    const profile = await UserProfile.findOne({ guildId, userId });
    const points = profile ? profile.points : 0;

    // Fetch ratings
    const ratings = await Rating.find({ guildId, userId });
    const ratingList = ratings.length
      ? ratings.map(r => `• ${r.rating} (by <@${r.givenBy}>)`).join('\n')
      : 'No ratings yet.';

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle(`${target.username}'s Profile`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setColor(0x5865F2)
      .addFields(
        { name: 'Points', value: `${points}`, inline: true },
        { name: 'Ratings', value: ratingList, inline: false }
      )
      .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

    await interaction.reply({ embeds: [embed] });
  }
};
