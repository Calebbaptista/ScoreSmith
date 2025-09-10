const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Profile = require('../../models/Profile');
const Point = require('../../models/Point');
const Rating = require('../../models/Rating');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewprofile')
    .setDescription('View a user’s profile')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to view')
        .setRequired(false)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const guildId = interaction.guild.id;

    const profile = await Profile.findOne({ userId: target.id, guildId });
    const points = await Point.find({ userId: target.id, guildId });
    const ratings = await Rating.find({ userId: target.id, guildId });

    const pointSummary = {};
    for (const point of points) {
      pointSummary[point.type] = (pointSummary[point.type] || 0) + 1;
    }

    const ratingSummary = {};
    for (const rating of ratings) {
      ratingSummary[rating.type] = (ratingSummary[rating.type] || []).concat(rating.value);
    }

    const embed = new EmbedBuilder()
      .setTitle(`📜 ${target.username}'s Profile`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setColor(0x8e44ad)
      .addFields(
        {
          name: '📅 Joined',
          value: profile?.joinDate
            ? `<t:${Math.floor(new Date(profile.joinDate).getTime() / 1000)}:D>`
            : 'Unknown',
          inline: true
        },
        {
          name: '🏅 Points',
          value: Object.keys(pointSummary).length
            ? Object.entries(pointSummary).map(([type, count]) => `• **${type}**: ${count}`).join('\n')
            : 'No points recorded',
          inline: false
        },
        {
          name: '📈 Ratings',
          value: Object.keys(ratingSummary).length
            ? Object.entries(ratingSummary).map(([type, values]) => {
                const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
                return `• **${type}**: ${avg} (${values.length} ratings)`;
              }).join('\n')
            : 'No ratings recorded',
          inline: false
        }
      );

    await interaction.reply({ embeds: [embed] });
  }
};
