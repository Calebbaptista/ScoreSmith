const mongoose = require('mongoose');
const ratingSchema = new mongoose.Schema({
  userId: String,
  guildId: String,
  type: String,
  value: Number,
  reason: String,
  raterId: String,
  timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Rating', ratingSchema);
