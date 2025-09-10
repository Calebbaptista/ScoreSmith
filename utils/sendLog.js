const LogChannel = require('../models/LogChannel');
const { client } = require('../index'); // or pass client in if needed

module.exports = async (guildId, embed) => {
  try {
    const config = await LogChannel.findOne({ guildId });
    if (!config) return;

    const channel = await client.channels.fetch(config.channelId);
    if (!channel) return;

    await channel.send(embed);
  } catch (err) {
    console.error('❌ Logging error:', err);
  }
};
