const { SlashCommandBuilder } = require('discord.js');
const Profile = require('../../models/Profile');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewprofile')
    .setDescription('View a user’s ceremonial profile')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to view')
        .setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const guildId = interaction.guild.id;

    const profile = await Profile.findOne({ userId: user.id, guildId });

    if (!profile) {
      await interaction.reply({ content: `⚠️ No profile found for <@${user.id}>.`, flags: 64 });
      return;
    }

    const summary = `📜 Profile for <@${user.id}>:\n• Title: ${profile.title || 'None'}\n• Bio: ${profile.bio || 'None'}\n• Joined: ${profile.joinDate?.toDateString() || 'Unknown'}`;

    await interaction.reply({ content: summary, flags: 64 });
  }
};
