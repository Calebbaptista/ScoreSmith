require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const mongoose = require('mongoose');

// Instantiate Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel]
});

// Load slash commands
client.commands = new Collection();
for (const file of fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(__dirname, 'commands', file));
  client.commands.set(command.data.name, command);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('🚨 MongoDB error:', err));

// Autocomplete handler
client.on('interactionCreate', async interaction => {
  if (interaction.isAutocomplete()) {
    const cmd = client.commands.get(interaction.commandName);
    if (cmd?.autocomplete) {
      try {
        const choices = await cmd.autocomplete(interaction);
        await interaction.respond(choices);
      } catch (e) {
        console.error('Autocomplete error:', e);
      }
    }
    return;
  }

  // Slash-command handler
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`❌ ${interaction.commandName} error:`, err);
    if (!interaction.replied) {
      await interaction.reply({ content: 'Error executing command.', ephemeral: true });
    }
  }
});

// Ready event
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.application.commands.set(client.commands.map(c => c.data));
});

// Login
client.login(process.env.TOKEN);
