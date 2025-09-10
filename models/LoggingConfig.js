const mongoose = require('mongoose');

const loggingConfigSchema = new mongoose.Schema({
  guildId: String,
  channelId: String
});

module.exports = mongoose.model('LoggingConfig', loggingConfigSchema);
