const mongoose = require('mongoose');

const userRatingsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  system: { type: String, required: true },
  score: { type: Number, required: true },
  reason: { type: String, default: 'No reason provided.' }
});

module.exports = mongoose.model('UserRatings', userRatingsSchema);
