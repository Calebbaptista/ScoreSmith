const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  rating: {
    type: String,
    required: true
  },
  givenBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Rating', ratingSchema);
