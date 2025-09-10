const mongoose = require('mongoose');

const LogChannelSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true }
});

module.exports = mongoose.model('LogChannel', LogChannelSchema);
