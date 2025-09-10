const mongoose = require('mongoose');

const UserRatingsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  system: { type: String, required: true },
  score: { type: Number, required: true },
  reason: { type: String, default: '' }
});

module.exports = mongoose.model('UserRatings', UserRatingsSchema);
