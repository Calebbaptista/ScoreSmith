require('dotenv').config();
const { Client, GatewayIntentBits, Events, StringSelectMenuBuilder } = require('discord.js');
const mongoose = require('mongoose');

// Models
const PointType = require('./models/PointType');
const UserPoints = require('./models/UserPoints');
const RatingSystem = require('./models/RatingSystem');
const UserRatings = require('./models/UserRatings');
const LogChannel = require('./models/LogChannel');
const PointAccess = require('./models/PointAccess');
const PointLimit = require('./models/PointLimit');

// Discord Client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🟣 Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Error:', err));

client.once(Events.ClientReady, () => {
  console.log(`🛡️ ScoreSmith is online as ${client.user.tag}`);
});

// Utility: Embed Builder
const replyEmbed = (title, description, interaction, color = 0x6A0DAD) => ({
  embeds: [{
    title,
    description,
    color,
    timestamp: new Date().toISOString(),
    thumbnail: {
      url: interaction.guild.iconURL({ extension: 'png', size: 128 }) || ''
    },
    footer: {
      text: `By ${interaction.user.tag}`,
      icon_url: interaction.user.displayAvatarURL({ extension: 'png', size: 64 })
    }
  }]
});

// Utility: Logging Function
const sendLog = async (guildId, embed) => {
  try {
    const logConfig = await LogChannel.findOne({ guildId });
    if (!logConfig) return;
    const channel = await client.channels.fetch(logConfig.channelId);
    if (!channel) return;
    await channel.send(embed);
  } catch (err) {
    console.error('❌ Logging error:', err);
  }
};

// Interaction Handler
client.on(Events.InteractionCreate, async interaction => {
  const guildId = interaction.guild?.id;

  if (interaction.isChatInputCommand()) {
    try {
      const { commandName, options } = interaction;
      const user = options.getUser?.('user');

      if (commandName === 'view-profile') {
        const target = options.getUser('user');
        const activePointTypes = await PointType.find({ guildId });
        const userPoints = await UserPoints.find({ userId: target.id, guildId });

        const pointMap = {};
        for (const pt of userPoints) {
          pointMap[pt.type] = pt.amount;
        }

        let pointSection = `🏅 Points:\n`;
        if (activePointTypes.length) {
          for (const pt of activePointTypes) {
            const amount = pointMap[pt.name] || 0;
            pointSection += `• ${pt.name}: ${amount}\n`;
          }
        } else {
          pointSection += `• None\n`;
        }

        const activeSystems = await RatingSystem.find();
        const userRatings = await UserRatings.find({ userId: target.id });
        const validRatings = userRatings.filter(r => activeSystems.some(s => s.name === r.system));

        let ratingSection = `\n⭐ Ratings:\n`;
        if (validRatings.length) {
          for (const rt of validRatings) {
            ratingSection += `• ${rt.system}: ${rt.score}/10 ${rt.reason ? `— ${rt.reason}` : ''}\n`;
          }
        } else {
          ratingSection += `• None\n`;
        }

        const description = `📛 Profile for <@${target.id}>\n\n${pointSection}${ratingSection}`;
        await interaction.reply(replyEmbed('📜 Ceremonial Profile', description, interaction));
        return;
      }

      // Other command handlers go here...

    } catch (err) {
      console.error('❌ Command error:', err);
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({ content: '⚠️ Something went wrong while processing your command.', flags: 64 });
        } catch (e) {
          console.error('⚠️ Failed to reply in catch block:', e);
        }
      }
    }
  }

  if (interaction.isAutocomplete()) {
    const focused = interaction.options.getFocused(true);
    const guildId = interaction.guild.id;

    try {
      let choices = [];

      if (focused.name === 'type') {
        const pointTypes = await PointType.find({ guildId });
        choices = pointTypes.map(pt => ({ name: pt.name, value: pt.name }));
      }

      if (focused.name === 'system') {
        const systems = await RatingSystem.find();
        choices = systems.map(s => ({ name: s.name, value: s.name }));
      }

      const filtered = choices
        .filter(c => c.name.toLowerCase().includes(focused.value.toLowerCase()))
        .slice(0, 25);

      await interaction.respond(filtered.length ? filtered : [{ name: 'No matches found', value: 'none' }]);
    } catch (err) {
      console.error('❌ Autocomplete error:', err);
    }
  }

  if (interaction.isStringSelectMenu()) {
    try {
      const match = interaction.customId.match(/^toggle-access-(\d+)$/);
      if (!match) return;

      const roleId = match[1];
      const type = interaction.values[0];
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
      await interaction.reply({ content: `✅ ${message}`, ephemeral: true });
      await sendLog(guildId, replyEmbed(`🔧 Access ${action}`, message, interaction));
    } catch (err) {
      console.error('❌ Dropdown error:', err);
    }
  }
});

client.login(process.env.TOKEN);
