// deploy-commands.js
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

// grab your bot token and app ID from .env
const { TOKEN, CLIENT_ID } = process.env;
if (!TOKEN || !CLIENT_ID) {
  console.error('🚨 TOKEN or CLIENT_ID missing in .env');
  process.exit(1);
}

// load every command’s JSON
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .forEach(dirent => {
    const folder = path.join(commandsPath, dirent.name);
    fs.readdirSync(folder)
      .filter(f => f.endsWith('.js'))
      .forEach(file => {
        const command = require(path.join(folder, file));
        if (command?.data?.toJSON) {
          commands.push(command.data.toJSON());
        }
      });
  });

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    // register commands GLOBALLY — appears in all servers (may take ~1h)
    const registered = await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log(`✅ Registered ${registered.length} global commands`);
  } catch (error) {
    console.error('🚨 Command registration failed:', error);
    process.exit(1);
  }
})();
