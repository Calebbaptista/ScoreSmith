require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});
module.exports.client = client; // for use in sendLog.js

// 🔗 Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// 🔁 Dynamic Command Loader
const commandPath = path.join(__dirname, 'commands');
const loadCommand = (dir, name) => {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      const result = loadCommand(fullPath, name);
      if (result) return result;
    } else if (file.name.replace('.js', '') === name) {
      return fullPath;
    }
  }
  return null;
};

// 🧠 Autocomplete Handlers
const autocompleteHandlers = {
  type: require('./autocomplete/typeAutocomplete'),
  system: require('./autocomplete/systemAutocomplete')
};

// 🔧 Interaction Handler
client.on(Events.InteractionCreate, async interaction => {
  const guildId = interaction.guild?.id;
  if (!guildId) return;

  try {
    // 🗣 Slash Commands
    if (interaction.isChatInputCommand()) {
      const commandName = interaction.commandName;
      const file = loadCommand(commandPath, commandName);
      if (!file) return interaction.reply({ content: '⚠️ Command not found.', ephemeral: true });

      const handler = require(file);
      await handler(interaction);
    }

    // 🧠 Autocomplete
    if (interaction.isAutocomplete()) {
      const focused = interaction.options.getFocused(true);
      const handler = autocompleteHandlers[focused.name];
      if (handler && !interaction.responded) {
        await handler(interaction);
      }
    }

    // 🔘 Dropdown Menus (Access Toggling)
    if (interaction.isStringSelectMenu()) {
      const match = interaction.customId.match(/^toggle-access-(\d+)$/);
      if (!match) return;

      const roleId = match[1];
      const type = interaction.values[0];
      const PointAccess = require('./models/PointAccess');
      const replyEmbed = require('./utils/replyEmbed');
      const sendLog = require('./utils/sendLog');

      const access = await PointAccess.findOne({ guildId, type });
      const currentRoles = access?.allowedRoles || [];

      let updatedRoles;
      let action;

      if (currentRoles.includes(roleId)) {
        updatedRoles = currentRoles.filter(r => r !== roleId);
        action = 'removed';
      } else {
        updatedRoles = [...currentRoles, roleId];
        action = 'added';
      }

      await PointAccess.findOneAndUpdate(
        { guildId, type },
        { allowedRoles: updatedRoles },
        { upsert: true }
      );

      const message = `Role <@&${roleId}> has been **${action}** for point type **${type}**.`;

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: `✅ ${message}`, ephemeral: true });
      }

      await sendLog(guildId, replyEmbed(`🔧 Access ${action}`, message, interaction));
    }
  } catch (err) {
    console.error('❌ Interaction error:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '⚠️ Something went wrong.', ephemeral: true });
    }
  }
});

// 🚀 Bot Ready
client.once(Events.ClientReady, () => {
  console.log(`🟣 Logged in as ${client.user.tag}`);
});

// 🔑 Login
client.login(process.env.TOKEN);
