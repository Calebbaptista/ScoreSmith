const mongoose = require('mongoose');

const userRatingsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  ratings: [
    {
      systemName: String,
      score: Number,
      reason: String
    }
  ]
});

module.exports = mongoose.model('UserRatings', userRatingsSchema);
