require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const {
  Client,
  Collection,
  GatewayIntentBits
} = require('discord.js');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('🚨 MongoDB connection error:', err);
});

// Create Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// Load commands from commands/** folders
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
client.once('clientReady', async () => {
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

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error('🚨 Command execution error:', err);
      if (!interaction.isRepliable()) return;

      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content: '⚠️ Something went wrong.', flags: 1 << 6 });
        } else {
          await interaction.reply({ content: '⚠️ Something went wrong.', flags: 1 << 6 });
        }
      } catch (e) {
        console.error('🚨 Failed to send error response:', e);
      }
    }
  }
});

// Login
client.login(process.env.TOKEN);
