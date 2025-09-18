const mongoose = require('mongoose');

const guildConfigSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },
  pointLimit: {
    type: Number,
    default: 10
  },
  logsChannelId: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GuildConfig', guildConfigSchema);
