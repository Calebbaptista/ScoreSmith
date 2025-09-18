// deploy-commands.js
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const { TOKEN, CLIENT_ID, GUILD_IDS, GLOBAL_REGISTER } = process.env;
if (!TOKEN || !CLIENT_ID) {
  console.error('🚨 TOKEN and CLIENT_ID must be set in .env');
  process.exit(1);
}

// Load all slash-command definitions
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .forEach(dirent => {
    const folder = path.join(commandsPath, dirent.name);
    fs.readdirSync(folder)
      .filter(file => file.endsWith('.js'))
      .forEach(file => {
        const cmd = require(path.join(folder, file));
        if (cmd?.data) commands.push(cmd.data.toJSON());
      });
  });

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    // 1) Deploy per-guild if GUILD_IDS is set
    if (GUILD_IDS) {
      const guildIds = GUILD_IDS.split(',').map(id => id.trim()).filter(Boolean);

      for (const guildId of guildIds) {
        const res = await rest.put(
          Routes.applicationGuildCommands(CLIENT_ID, guildId),
          { body: commands }
        );
        console.log(`✅ Registered ${res.length} commands for guild ${guildId}`);
      }
    }
    // 2) Otherwise, if GLOBAL_REGISTER=true, deploy globally (takes ~1h to propagate)
    else if (GLOBAL_REGISTER === 'true') {
      const res = await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
      );
      console.log(`✅ Registered ${res.length} global commands`);
    }
    // 3) If neither is set, error out
    else {
      console.error('🚨 Neither GUILD_IDS nor GLOBAL_REGISTER=true is set in .env');
      process.exit(1);
    }
  } catch (err) {
    console.error('🚨 Command registration failed:', err);
  }
})();
