require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  // Point Type Commands
  new SlashCommandBuilder()
    .setName('add-point-type')
    .setDescription('Add a new point type for this server')
    .addStringOption(opt =>
      opt.setName('name').setDescription('Name of the point type').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('delete-point-type')
    .setDescription('Delete a point type from this server')
    .addStringOption(opt =>
      opt.setName('name').setDescription('Name of the point type').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('set-point-type-access')
    .setDescription('Restrict access to a point type by role')
    .addStringOption(opt =>
      opt.setName('name').setDescription('Point type name').setRequired(true)
    )
    .addRoleOption(opt =>
      opt.setName('role').setDescription('Role that can award this type').setRequired(true)
    ),

  // Add / Remove Points
  new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add points to a user')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to award').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('type').setDescription('Point type').setRequired(true).setAutocomplete(true)
    )
    .addIntegerOption(opt =>
      opt.setName('amount').setDescription('Amount to add').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove points from a user')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to deduct from').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('type').setDescription('Point type').setRequired(true).setAutocomplete(true)
    )
    .addIntegerOption(opt =>
      opt.setName('amount').setDescription('Amount to remove').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('view-points')
    .setDescription('View a user’s point totals')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to view').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('set-log-channel')
    .setDescription('Set the channel for logging bot actions')
    .addChannelOption(opt =>
      opt.setName('channel').setDescription('Channel to use').setRequired(true)
    ),

  // Rating System Commands
  new SlashCommandBuilder()
    .setName('create-rating-system')
    .setDescription('Create a new rating system')
    .addStringOption(opt =>
      opt.setName('name').setDescription('System name').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('description').setDescription('Optional description')
    ),

  new SlashCommandBuilder()
    .setName('delete-rating-system')
    .setDescription('Delete a rating system')
    .addStringOption(opt =>
      opt.setName('name').setDescription('System name').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('set-rating-system-access')
    .setDescription('Restrict rating system access by role')
    .addStringOption(opt =>
      opt.setName('name').setDescription('System name').setRequired(true)
    )
    .addRoleOption(opt =>
      opt.setName('role').setDescription('Role that can rate').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('rate-user')
    .setDescription('Rate a user in a system')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to rate').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('system').setDescription('Rating system').setRequired(true).setAutocomplete(true)
    )
    .addIntegerOption(opt =>
      opt.setName('score').setDescription('Score (1–10)').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for rating')
    ),

  new SlashCommandBuilder()
    .setName('view-ratings')
    .setDescription('View a user’s rating in a system')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to view').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('system').setDescription('Rating system').setRequired(true).setAutocomplete(true)
    ),

  new SlashCommandBuilder()
    .setName('delete-user-rating')
    .setDescription('Delete a user’s rating from a system')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to modify').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('system').setDescription('Rating system').setRequired(true).setAutocomplete(true)
    )
].map(cmd => cmd.toJSON());

// Deploy globally
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
