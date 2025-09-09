const mongoose = require('mongoose');

const ratingSystemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  requiredRoleIds: [{ type: String }] // Optional role restrictions
});

ratingSystemSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('RatingSystem', ratingSystemSchema);
