require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const { TOKEN, CLIENT_ID } = process.env;
if (!TOKEN || !CLIENT_ID) {
  console.error('🚨 Missing TOKEN or CLIENT_ID in .env');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .forEach(dirent => {
    const folderPath = path.join(commandsPath, dirent.name);
    fs.readdirSync(folderPath)
      .filter(file => file.endsWith('.js'))
      .forEach(file => {
        const command = require(path.join(folderPath, file));
        if (command?.data?.toJSON) {
          commands.push(command.data.toJSON());
        }
      });
  });

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
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
