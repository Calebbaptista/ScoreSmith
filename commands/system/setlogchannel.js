const LogChannel = require('../../models/LogChannel');

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const channel = interaction.options.getChannel('channel');

  await LogChannel.findOneAndUpdate(
    { guildId },
    { channelId: channel.id },
    { upsert: true }
  );

  await interaction.reply({
    content: `✅ Log channel set to <#${channel.id}>.`,
    ephemeral: true
  });
};
