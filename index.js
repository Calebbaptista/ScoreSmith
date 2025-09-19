// index.js
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

// --- Discord client setup ---
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// --- Load command files dynamically ---
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

// --- MongoDB connection ---
mongoose.connect(process.env.MONGO_URI, {
  // these options are no longer needed in driver v4+, safe to omit
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- Ready event ---
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// --- Interaction handler ---
client.on('interactionCreate', async interaction => {
  try {
    // Handle autocomplete
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) {
        await command.autocomplete(interaction);
      }
      return;
    }

    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
    }
  } catch (err) {
    console.error(err);
    if (interaction.isRepliable() && !interaction.replied) {
      await interaction.reply({
        content: '🚨 Something went wrong while executing this command.',
        flags: 1 << 6 // ephemeral
      });
    }
  }
});

// --- Login ---
client.login(process.env.TOKEN);
