require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Ready event
client.once('clientReady', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Interaction handler
client.on('interactionCreate', async interaction => {
  try {
    // --- Autocomplete ---
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) {
        try {
          await command.autocomplete(interaction);
        } catch (err) {
          console.error('Autocomplete error:', err);
        }
      }
      return; // stop here, don’t fall through
    }

    // --- Slash commands ---
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction);
    }
  } catch (err) {
    console.error('Command error:', err);
    // Only reply if not already acknowledged
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply('🚨 Something went wrong while executing this command.');
      } catch (e) {
        console.error('Failed to send error reply:', e);
      }
    }
  }
});

// Login
client.login(process.env.TOKEN);
