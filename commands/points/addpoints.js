const { SlashCommandBuilder } = require('discord.js');
const Point = require('../../models/Point');
const PointLimit = require('../../models/PointLimit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addpoints')
    .setDescription('Add points to one or more users')
    .addMentionableOption(option =>
      option.setName('targets')
        .setDescription('User or role to award points to')
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
        .setDescription('Points to add per user')
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
        content: `⚠️ You can only add up to ${limit} points per user at a time.`,
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

    // Add points
    for (const user of users) {
      for (let i = 0; i < amount; i++) {
        await Point.create({ userId: user.id, guildId, type });
      }
    }

    await interaction.reply({
      content: `✅ Added ${amount} **${type}** point(s) to ${users.map(u => `@${u.username}`).join(', ')}.`,
      allowedMentions: { users: users.map(u => u.id) }
    });
  }
};
