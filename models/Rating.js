// models/Rating.js
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  targetId: { type: String, required: true }, // the user being rated
  raterId:  { type: String, required: true }, // who gave the rating
  rating:   { type: Number, required: true, min: 1, max: 10 },
  reason:   { type: String, required: true },
  createdAt:{ type: Date, default: Date.now }
});

// Ensure one rater can only rate a target once per guild
ratingSchema.index({ guildId: 1, targetId: 1, raterId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
