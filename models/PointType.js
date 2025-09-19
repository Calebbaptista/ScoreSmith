// models/PointType.js
const mongoose = require('mongoose');

const pointTypeSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  name:    { type: String, required: true }
});

// Ensure each guild can only have one of each name
pointTypeSchema.index({ guildId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('PointType', pointTypeSchema);
