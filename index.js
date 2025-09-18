// Silence only the Discord.js 'ready → clientReady' deprecation
const _emitWarning = process.emitWarning;
process.emitWarning = (warning, type, code, ...args) => {
  if (
    type === 'DeprecationWarning' &&
    typeof warning === 'string' &&
    warning.includes('The ready event has been renamed to clientReady')
  ) {
    return;
  }
  _emitWarning.call(process, warning, type, code, ...args);
};

require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const mongoose = require('mongoose');

// Create the Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// Load slash command modules
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

// Connect to MongoDB (no deprecated flags)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('🚨 MongoDB connection error:', err));

// v14 ready event (silenced above)
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.application.commands.set(client.commands.map(cmd => cmd.data));
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error(`❌ Error in ${interaction.commandName}:`, err);
    if (!interaction.replied) {
      await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
    }
  }
});

// Login to Discord
client.login(process.env.TOKEN);
