const mongoose = require('mongoose');

const ratingSystemSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  types: { type: [String], default: [] } // e.g., ["honor", "skill", "prestige"]
});

module.exports = mongoose.model('RatingSystem', ratingSystemSchema);
