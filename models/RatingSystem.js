const mongoose = require('mongoose');

const ratingSystemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' }
});

module.exports = mongoose.model('RatingSystem', ratingSystemSchema);
