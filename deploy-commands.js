require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('add-point-type')
    .setDescription('Create a new point type')
    .addStringOption(opt => opt.setName('name').setDescription('Point type name').setRequired(true)),

  new SlashCommandBuilder()
    .setName('remove-point-type')
    .setDescription('Delete an existing point type')
    .addStringOption(opt => opt.setName('name').setDescription('Point type name').setRequired(true)),

  new SlashCommandBuilder()
    .setName('add-points')
    .setDescription('Add points to a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to award').setRequired(true))
    .addStringOption(opt => opt.setName('type').setDescription('Point type').setRequired(true).setAutocomplete(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to add').setRequired(true)),

  new SlashCommandBuilder()
    .setName('remove-points')
    .setDescription('Remove points from a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to deduct from').setRequired(true))
    .addStringOption(opt => opt.setName('type').setDescription('Point type').setRequired(true).setAutocomplete(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to remove').setRequired(true)),

  new SlashCommandBuilder()
    .setName('add-rating-type')
    .setDescription('Create a new rating system')
    .addStringOption(opt => opt.setName('name').setDescription('Rating system name').setRequired(true))
    .addStringOption(opt => opt.setName('description').setDescription('Description').setRequired(false)),

  new SlashCommandBuilder()
    .setName('remove-rating-type')
    .setDescription('Delete a rating system')
    .addStringOption(opt => opt.setName('name').setDescription('Rating system name').setRequired(true)),

  new SlashCommandBuilder()
    .setName('add-rate')
    .setDescription('Rate a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to rate').setRequired(true))
    .addStringOption(opt => opt.setName('system').setDescription('Rating system').setRequired(true).setAutocomplete(true))
    .addIntegerOption(opt => opt.setName('score').setDescription('Score (1–10)').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for rating').setRequired(false)),

  new SlashCommandBuilder()
    .setName('remove-rating')
    .setDescription('Delete a user’s rating')
    .addUserOption(opt => opt.setName('user').setDescription('User to unrate').setRequired(true))
    .addStringOption(opt => opt.setName('system').setDescription('Rating system').setRequired(true).setAutocomplete(true)),

  new SlashCommandBuilder()
    .setName('view-profile')
    .setDescription('View a user’s ceremonial profile')
    .addUserOption(opt => opt.setName('user').setDescription('User to view').setRequired(true)),

  new SlashCommandBuilder()
    .setName('set-log-channel')
    .setDescription('Set the channel for logging bot actions')
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to use').setRequired(true))
]
.map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🌐 Deploying commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Commands deployed successfully.');
  } catch (err) {
    console.error('❌ Deployment error:', err);
  }
})();
