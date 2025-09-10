const PointType = require('../../models/PointType');
const UserPoints = require('../../models/UserPoints');
const RatingSystem = require('../../models/RatingSystem');
const UserRatings = require('../../models/UserRatings');

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const user = interaction.options.getUser('user');

  // Fetch active point types
  const activePointTypes = await PointType.find({ guildId });

  // Fetch user's points
  const userPoints = await UserPoints.find({ userId: user.id, guildId });

  // Map user's points by type
  const pointMap = {};
  for (const pt of userPoints) {
    pointMap[pt.type] = pt.amount;
  }

  // Build point section
  let pointSection = `🏅 Points:\n`;
  for (const pt of activePointTypes) {
    const amount = pointMap[pt.name] || 0;
    pointSection += `• ${pt.name}: ${amount}\n`;
  }

  // Fetch active rating systems
  const activeSystems = await RatingSystem.find();

  // Fetch user's ratings
  const userRatings = await UserRatings.find({ userId: user.id });

  // Filter ratings to only active systems
  const validRatings = userRatings.filter(r => activeSystems.some(s => s.name === r.system));

  // Build rating section
  let ratingSection = `\n⭐ Ratings:\n`;
  for (const rt of validRatings) {
    ratingSection += `• ${rt.system}: ${rt.score}/10 ${rt.reason ? `— ${rt.reason}` : ''}\n`;
  }

  const description = `📛 Profile for <@${user.id}>\n\n${pointSection}${ratingSection}`;
  await interaction.reply({
    embeds: [{
      title: '📜 Ceremonial Profile',
      description,
      color: 0x6A0DAD,
      timestamp: new Date().toISOString(),
      thumbnail: {
        url: interaction.guild.iconURL({ extension: 'png', size: 128 }) || ''
      },
      footer: {
        text: `By ${interaction.user.tag}`,
        icon_url: interaction.user.displayAvatarURL({ extension: 'png', size: 64 })
      }
    }]
  });
};
