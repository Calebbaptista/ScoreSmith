const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Schema
const pointTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});
const PointType = mongoose.model('PointType', pointTypeSchema);

// Create Discord Client
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('🟣 Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB Error:', err));

// Bot Ready
client.once('ready', () => {
  console.log(`🛡️ ScoreSmith is online as ${client.user.tag}`);
});

// Handle Slash Commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'addpointtype') {
    const name = interaction.options.getString('name');

    try {
      const exists = await PointType.findOne({ name });
      if (exists) {
        await interaction.reply({
          content: `⚠️ Point type **${name}** already exists.`,
          ephemeral: true
        });
      } else {
        await PointType.create({ name });
        await interaction.reply({
          content: `✅ Point type **${name}** added.`,
          ephemeral: true
        });
      }
    } catch (err) {
      console.error('❌ Error adding point type:', err);
      await interaction.reply({
        content: '❌ Failed to add point type. Try again later.',
        ephemeral: true
      });
    }
  }
});

// Login to Discord
client.login(process.env.TOKEN);
