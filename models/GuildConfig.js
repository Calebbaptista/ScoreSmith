const mongoose = require('mongoose');

const GuildConfigSchema = new mongoose.Schema({
  guildId:     { type: String, required: true, unique: true },
  logChannel:  { type: String, default: null },
  prefix:      { type: String, default: '/' }
});

module.exports = mongoose.model('GuildConfig', GuildConfigSchema);
