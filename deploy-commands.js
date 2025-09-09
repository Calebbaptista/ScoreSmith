const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  // 🔧 Point System Commands
  new SlashCommandBuilder()
    .setName('addpointtype')
    .setDescription('Create a new point type')
    .addStringOption(opt =>
      opt.setName('name')
        .setDescription('Name of the point type')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('deletepointtype')
    .setDescription('Delete an existing point type')
    .addStringOption(opt =>
      opt.setName('name')
        .setDescription('Name of the point type to delete')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add points to a user')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to give points to')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Point type')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption(opt =>
      opt.setName('amount')
        .setDescription('Amount of points')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove points from a user')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to remove points from')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Point type')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption(opt =>
      opt.setName('amount')
        .setDescription('Amount to remove')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('setlogchannel')
    .setDescription('Set the log channel for point/rating updates')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel to log updates')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('viewpoints')
    .setDescription('View a user’s points')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to view')
        .setRequired(true)
    ),

  // 🏅 Rating System Commands
  new SlashCommandBuilder()
    .setName('createratingsystem')
    .setDescription('Create a new rating system')
    .addStringOption(opt =>
      opt.setName('name')
        .setDescription('Name of the rating system')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('description')
        .setDescription('Optional description')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('deleteratingsystem')
    .setDescription('Delete a rating system')
    .addStringOption(opt =>
      opt.setName('name')
        .setDescription('Name of the rating system to delete')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  new SlashCommandBuilder()
    .setName('rateuser')
    .setDescription('Rate a user from 1–10 in a system')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to rate')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('system')
        .setDescription('Rating system')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption(opt =>
      opt.setName('score')
        .setDescription('Score from 1 to 10')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Reason for rating')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('deleteuserrating')
    .setDescription('Delete a user’s rating in a system')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to unrate')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('system')
        .setDescription('Rating system to remove')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  new SlashCommandBuilder()
    .setName('viewratings')
    .setDescription('View a user’s rating in a system')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to view')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('system')
        .setDescription('Rating system to view')
        .setRequired(true)
        .setAutocomplete(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔧 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Slash commands registered.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();
