// models/Rating.js
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  type:    { type: String, required: true }, // matches PointType.name
  min:     { type: Number, required: true }, // minimum points for this rating
  label:   { type: String, required: true }  // e.g. "Apprentice"
});

ratingSchema.index({ guildId: 1, type: 1, min: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
