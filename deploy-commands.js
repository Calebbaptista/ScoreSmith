require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandPath = path.join(__dirname, 'commands');

// 🔁 Recursively load all command files
const loadCommands = (dir) => {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      loadCommands(fullPath);
    } else if (file.name.endsWith('.js')) {
      const command = require(fullPath);
      if (command?.data) {
        commands.push(command.data.toJSON());
      }
    }
  }
};

loadCommands(commandPath);

// 🔗 Discord REST setup
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`📜 Deploying ${commands.length} commands...`);

    // 🛡️ Global registration
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    // 🧪 Dev-only registration (optional)
    // await rest.put(
    //   Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    //   { body: commands }
    // );

    console.log('✅ Commands deployed successfully.');
  } catch (err) {
    console.error('❌ Deployment error:', err);
  }
})();
