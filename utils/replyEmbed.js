module.exports = (title, description, interaction, color = 0x6A0DAD) => ({
  embeds: [{
    title,
    description,
    color,
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
