require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

// Create the client with required intents
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Initialize command collection
client.commands = new Collection();

// Load all commands from commands/** folders
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .forEach(dirent => {
    const folderPath = path.join(commandsPath, dirent.name);
    fs.readdirSync(folderPath)
      .filter(file => file.endsWith('.js'))
      .forEach(file => {
        const command = require(path.join(folderPath, file));
        if (command?.data?.name) {
          client.commands.set(command.data.name, command);
        }
      });
  });

// On bot ready
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    const globalCommands = await client.application.commands.fetch();
    console.log('🔍 Global commands:', globalCommands.map(cmd => cmd.name));
  } catch (err) {
    console.error('🚨 Failed to fetch global commands:', err);
  }
});

// Handle interactions
client.on('interactionCreate', async interaction => {
  // Autocomplete
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (command?.autocomplete) {
      try {
        await command.autocomplete(interaction);
      } catch (err) {
        console.error('🚨 Autocomplete error:', err);
      }
    }
    return;
  }

  // Slash command execution
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error('🚨 Command execution error:', err);
      const replyOptions = { content: '⚠️ Something went wrong.', ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(replyOptions);
      } else {
        await interaction.reply(replyOptions);
      }
    }
  }
});

// Login
client.login(process.env.TOKEN);
