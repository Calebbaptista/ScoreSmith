const mongoose = require('mongoose');

const UserPointsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  type: { type: String, required: true },
  amount: { type: Number, default: 0 }
});

module.exports = mongoose.model('UserPoints', UserPointsSchema);
