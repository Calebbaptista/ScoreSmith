// inside /viewprofile execute()
const ratings = await Rating.find({ guildId: interaction.guildId, targetId: user.id });

if (ratings.length) {
  const avg = (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1);
  embed.addFields(
    { name: 'Average Rating', value: `${avg}/10 (${ratings.length} ratings)`, inline: false }
  );

  // Show up to 3 most recent reasons
  ratings.slice(-3).forEach(r => {
    embed.addFields({
      name: `⭐ ${r.rating}/10 from <@${r.raterId}>`,
      value: r.reason
    });
  });
}
