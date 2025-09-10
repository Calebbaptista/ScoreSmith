const { SlashCommandBuilder } = require('discord.js');
const PointLimit = require('../../models/PointLimit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewpointlimit')
    .setDescription('View daily point limits for all types'),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const limits = await PointLimit.find({ guildId });

    if (!limits.length) {
      await interaction.reply({ content: '⚠️ No point limits configured.', flags: 64 });
      return;
    }

    const summary = limits
      .map(limit => `• **${limit.type}**: ${limit.limit} per day`)
      .join('\n');

    await interaction.reply({ content: `📏 Point Limits:\n${summary}`, flags: 64 });
  }
};
