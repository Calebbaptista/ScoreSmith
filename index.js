require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const mongoose = require('mongoose');

// Instantiate the Discord client
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

// Autocomplete interactions
client.on('interactionCreate', async interaction => {
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

  // Slash‐command interactions
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`❌ Error executing ${interaction.commandName}:`, err);
    if (!interaction.replied) {
      await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
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
