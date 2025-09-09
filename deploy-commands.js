const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
  {
    name: 'addpointtype',
    description: 'Create a new point type',
    options: [
      {
        name: 'name',
        type: 3, // STRING
        description: 'Name of the point type',
        required: true,
      },
    ],
  },
  // Add more commands here as needed
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔧 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Slash commands registered.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();
