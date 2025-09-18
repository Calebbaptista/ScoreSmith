const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  guildId:   { type: String, required: true },
  userId:    { type: String, required: true },
  rating:    { type: Number, required: true },
  reason:    { type: String, required: true },
  createdAt: { type: Date,   default: Date.now }
});

module.exports = mongoose.model('Rating', RatingSchema);
