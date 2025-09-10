const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  userId: String,
  guildId: String,
  type: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Point', pointSchema);
