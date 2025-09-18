// index.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, Intents } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
for (const folder of fs.readdirSync(commandsPath)) {
  const folderPath = path.join(commandsPath, folder);
  if (!fs.lstatSync(folderPath).isDirectory()) continue;

  for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))) {
    const command = require(path.join(folderPath, file));
    client.commands.set(command.data.name, command);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Show exactly what Discord has registered
  try {
    const guildCommands = await client.application.commands.fetch({ guildId: process.env.GUILD_ID });
    console.log('🔍 Live guild commands:', JSON.stringify(guildCommands.map(c => c.toJSON()), null, 2));
  } catch (err) {
    console.error('🚨 Error fetching guild commands:', err);
  }
});

client.on('interactionCreate', async interaction => {
  // Debug Autocomplete
  if (interaction.isAutocomplete()) {
    console.log(
      '🔍 Autocomplete interaction:',
      interaction.commandName,
      'focused →', interaction.options.getFocused()
    );
    const command = client.commands.get(interaction.commandName);
    if (command?.autocomplete) {
      try {
        await command.autocomplete(interaction);
      } catch (err) {
        console.error('🚨 Autocomplete handler error:', err);
      }
    } else {
      console.warn(`⚠️ No autocomplete handler for /${interaction.commandName}`);
    }
    return;
  }

  // Debug Slash Commands
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error('🚨 Command execution error:', err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '⚠️ Something went wrong.', ephemeral: true });
    } else {
      await interaction.reply({ content: '⚠️ Something went wrong.', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
