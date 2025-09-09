require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  // Setup Server with Access Configuration
  new SlashCommandBuilder()
    .setName('setup-server')
    .setDescription('Initialize ScoreSmith and configure access roles')
    .addRoleOption(opt => opt.setName('points-add').setDescription('Who can add points'))
    .addRoleOption(opt => opt.setName('points-remove').setDescription('Who can remove points'))
    .addRoleOption(opt => opt.setName('ratings-rate').setDescription('Who can rate users'))
    .addRoleOption(opt => opt.setName('ratings-delete').setDescription('Who can delete ratings')),

  // Update Access Roles
  new SlashCommandBuilder()
    .setName('update-access')
    .setDescription('Update which roles can perform specific ScoreSmith actions')
    .addStringOption(opt =>
      opt.setName('category')
        .setDescription('Category (points or ratings)')
        .setRequired(true)
        .addChoices(
          { name: 'points', value: 'points' },
          { name: 'ratings', value: 'ratings' }
        )
    )
    .addStringOption(opt =>
      opt.setName('action')
        .setDescription('Action (add, remove, rate, delete, view)')
        .setRequired(true)
        .addChoices(
          { name: 'add', value: 'add' },
          { name: 'remove', value: 'remove' },
          { name: 'rate', value: 'rate' },
          { name: 'delete', value: 'delete' },
          { name: 'view', value: 'view' }
        )
    )
    .addRoleOption(opt => opt.setName('role1').setDescription('First role').setRequired(true))
    .addRoleOption(opt => opt.setName('role2').setDescription('Second role').setRequired(false))
    .addRoleOption(opt => opt.setName('role3').setDescription('Third role').setRequired(false)),

  // Configure Role Classification
  new SlashCommandBuilder()
    .setName('configure-role')
    .setDescription('Classify a role as a main rank or medal')
    .addRoleOption(opt => opt.setName('role').setDescription('Role to configure').setRequired(true))
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Role type')
        .setRequired(true)
        .addChoices(
          { name: 'main', value: 'main' },
          { name: 'medal', value: 'medal' }
        )
    )
    .addStringOption(opt =>
      opt.setName('action')
        .setDescription('Add or remove')
        .setRequired(true)
        .addChoices(
          { name: 'add', value: 'add' },
          { name: 'remove', value: 'remove' }
        )
    ),

  // Rank Commands
  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Preview ceremonial status or promote user')
    .addStringOption(opt =>
      opt.setName('action')
        .setDescription('Action to perform')
        .setRequired(true)
        .addChoices(
          { name: 'preview', value: 'preview' },
          { name: 'promote', value: 'promote' }
        )
    )
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
    .addRoleOption(opt => opt.setName('role').setDescription('Rank role to assign (for promote)').setRequired(false)),

  // Rating Commands
  new SlashCommandBuilder()
    .setName('rating')
    .setDescription('Rate, view, or delete a user’s rating')
    .addStringOption(opt =>
      opt.setName('action')
        .setDescription('Action to perform')
        .setRequired(true)
        .addChoices(
          { name: 'rate', value: 'rate' },
          { name: 'view', value: 'view' },
          { name: 'delete', value: 'delete' }
        )
    )
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(opt =>
      opt.setName('system')
        .setDescription('Rating system')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption(opt => opt.setName('score').setDescription('Score (1–10)').setRequired(false))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for rating').setRequired(false)),

  // Point Management
  new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add points to a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to award').setRequired(true))
    .addStringOption(opt =>
      opt.setName('type').setDescription('Point type').setRequired(true).setAutocomplete(true)
    )
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to add').setRequired(true)),

  new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove points from a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to deduct from').setRequired(true))
    .addStringOption(opt =>
      opt.setName('type').setDescription('Point type').setRequired(true).setAutocomplete(true)
    )
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to remove').setRequired(true)),

  new SlashCommandBuilder()
    .setName('view-points')
    .setDescription('View a user’s point totals')
    .addUserOption(opt => opt.setName('user').setDescription('User to view').setRequired(true)),

  // Logging
  new SlashCommandBuilder()
    .setName('set-log-channel')
    .setDescription('Set the channel for logging bot actions')
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to use').setRequired(true))
]
.map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🌐 Deploying global commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Global commands deployed successfully.');
  } catch (err) {
    console.error('❌ Deployment error:', err);
  }
})();
