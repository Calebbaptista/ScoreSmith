require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');

// 🔗 Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// 🔱 Create Discord Client
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 🗂️ Load Commands
client.commands = new Collection();

const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(path.join(__dirname, 'commands', folder)).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    if (command.data && typeof command.execute === 'function') {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`⚠️ Skipping invalid command file: ${file}`);
    }
  }
}

// 🧠 Load Autocomplete Handlers
client.autocompleteHandlers = new Collection();

const autocompleteFiles = fs.readdirSync(path.join(__dirname, 'autocomplete')).filter(file => file.endsWith('.js'));
for (const file of autocompleteFiles) {
  const handler = require(`./autocomplete/${file}`);
  const name = path.basename(file, '.js');
  if (typeof handler === 'function') {
    client.autocompleteHandlers.set(name, handler);
  } else {
    console.warn(`⚠️ Skipping invalid autocomplete file: ${file}`);
  }
}

// 🧭 Handle Interactions
client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction);
    }

    else if (interaction.isAutocomplete()) {
      const focusedOption = interaction.options.getFocused(true);
      const handler = client.autocompleteHandlers.get(focusedOption.name);
      if (handler) {
        await handler(interaction);
      }
    }
  } catch (error) {
    console.error(`❌ Interaction error:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'An error occurred.', ephemeral: true });
    } else {
      await interaction.reply({ content: 'An error occurred.', ephemeral: true });
    }
  }
});

// 🟣 Login
client.once('ready', () => {
  console.log(`🟣 Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
