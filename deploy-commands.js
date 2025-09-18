// deploy-commands.js
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

// Ensure required env vars are set
const { TOKEN, CLIENT_ID, GUILD_IDS, GLOBAL_REGISTER } = process.env;
if (!TOKEN || !CLIENT_ID) {
  console.error('🚨 Missing TOKEN or CLIENT_ID in .env');
  process.exit(1);
}

// Load all slash‐command definitions from commands/** directories
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
    // 1) Deploy per-guild if GUILD_IDS is provided
    if (GUILD_IDS) {
      const guildIds = GUILD_IDS.split(',').map(id => id.trim()).filter(Boolean);
      for (const guildId of guildIds) {
        const registered = await rest.put(
          Routes.applicationGuildCommands(CLIENT_ID, guildId),
          { body: commands }
        );
        console.log(`✅ Registered ${registered.length} commands for guild ${guildId}`);
      }
    }
    // 2) Otherwise, if GLOBAL_REGISTER=true, deploy globally
    else if (GLOBAL_REGISTER === 'true') {
      const registered = await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
      );
      console.log(`✅ Registered ${registered.length} global commands`);
    }
    // 3) If neither is set, error out to avoid undefined guild_id
    else {
      console.error('🚨 .env must include either GUILD_IDS or GLOBAL_REGISTER=true');
      process.exit(1);
    }
  } catch (error) {
    console.error('🚨 Command registration failed:', error);
    process.exit(1);
  }
})();
