// index.js

// Suppress the Discord.js “ready → clientReady” DeprecationWarning
const { emitWarning } = process;
process.emitWarning = (msg, type, code, ...args) => {
  if (
    type === 'DeprecationWarning' &&
    msg.includes('The ready event has been renamed to clientReady')
  ) {
    return;
  }
  emitWarning(msg, type, code, ...args);
};

require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const mongoose = require('mongoose');

// Instantiate Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// Load slash commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('🚨 MongoDB connection error:', err));

// Global error handlers
client.on('error', console.error);
process.on('unhandledRejection', console.error);

// Handle interactions
client.on('interactionCreate', async interaction => {
  // 1️⃣ Autocomplete interactions
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (command?.autocomplete) {
      try {
        const choices = await command.autocomplete(interaction);
        await interaction.respond(choices);
      } catch (err) {
        console.error('Autocomplete error:', err);
      }
    }
    return;
  }

  // 2️⃣ Slash‐command interactions
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`❌ Error executing ${interaction.commandName}:`, err);
    if (!interaction.replied) {
      await interaction.reply({ content: 'Error executing command.', flags: 1 << 6 });
    }
  }
});

// Ready event (v14)
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.application.commands.set(client.commands.map(cmd => cmd.data));
});

// Login to Discord
client.login(process.env.TOKEN);
