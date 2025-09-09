const mongoose = require('mongoose');

const ratingSystemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String }
});

module.exports = mongoose.model('RatingSystem', ratingSystemSchema);
