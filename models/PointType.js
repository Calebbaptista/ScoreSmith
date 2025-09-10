const mongoose = require('mongoose');

const ratingTypeSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  name: { type: String, required: true }
});

module.exports = mongoose.model('RatingType', ratingTypeSchema);
