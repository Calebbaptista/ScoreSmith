const { SlashCommandBuilder } = require('discord.js');
const Point = require('../../models/Point');
const PointLimit = require('../../models/PointLimit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removepoints')
    .setDescription('Remove points from one or more users')
    .addMentionableOption(option =>
      option.setName('targets')
        .setDescription('User or role to remove points from')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of point')
        .setRequired(true)
        .addChoices(
          { name: 'Skill', value: 'Skill' },
          { name: 'Honor', value: 'Honor' },
          { name: 'Wisdom', value: 'Wisdom' },
          { name: 'Valor', value: 'Valor' }
        )
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Points to remove per user')
        .setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getMentionable('targets');
    const type = interaction.options.getString('type');
    const amount = interaction.options.getInteger('amount');
    const guildId = interaction.guild.id;

    // Enforce point limit
    const config = await PointLimit.findOne({ guildId });
    const limit = config?.limit || 10;

    if (amount > limit) {
      await interaction.reply({
        content: `⚠️ You can only remove up to ${limit} points per user at a time.`,
        ephemeral: true
      });
      return;
    }

    // Resolve users from mentionable
    let users = [];
    if (target.user) {
      users = [target.user];
    } else if (target.members) {
      users = Array.from(target.members.values());
    }

    if (users.length === 0) {
      await interaction.reply({
        content: `⚠️ No valid users found in selection.`,
        ephemeral: true
      });
      return;
    }

    let summary = [];

    for (const user of users) {
      const points = await Point.find({ userId: user.id, guildId, type }).limit(amount);
      if (!points.length) {
        summary.push(`⚠️ No ${type} points found for @${user.username}`);
        continue;
      }

      let removed = 0;
      for (const point of points) {
        await point.deleteOne();
        removed++;
        if (removed >= amount) break;
      }

      summary.push(`✅ Removed ${removed} **${type}** point(s) from @${user.username}`);
    }

    await interaction.reply({
      content: summary.join('\n'),
      allowedMentions: { users: users.map(u => u.id) }
    });
  }
};
