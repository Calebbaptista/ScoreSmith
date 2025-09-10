const mongoose = require('mongoose');

const logConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true }
});

module.exports = mongoose.model('LogConfig', logConfigSchema);
