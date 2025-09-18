const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Rating = require('../models/Rating');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addrating')
    .setDescription('Add a rating to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to rate')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('rating')
        .setDescription('The name of the rating')
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const user = interaction.options.getUser('user');
    const rating = interaction.options.getString('rating');

    // Check for duplicate rating
    const existing = await Rating.findOne({
      guildId,
      userId: user.id,
      rating,
      givenBy: interaction.user.id
    });

    if (existing) {
      const duplicateEmbed = new EmbedBuilder()
        .setTitle('⚠️ Rating Already Exists')
        .setDescription(`You’ve already given <@${user.id}> the rating **${rating}**.`)
        .setColor(0xFFA500);
      return interaction.reply({ embeds: [duplicateEmbed], ephemeral: true });
    }

    // Save rating
    await Rating.create({
      guildId,
      userId: user.id,
      rating,
      givenBy: interaction.user.id
    });

    const embed = new EmbedBuilder()
      .setTitle('🏅 Rating Added')
      .setDescription(`<@${user.id}> has been awarded the rating **${rating}**.`)
      .setColor(0x00BFFF)
      .setFooter({ text: `Given by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

    await interaction.reply({ embeds: [embed] });
  }
};
