// models/PointType.js
const mongoose = require('mongoose');

const PointTypeSchema = new mongoose.Schema({
  guildId:   { type: String, required: true },
  name:      { type: String, required: true },
  createdAt: { type: Date,   default: Date.now }
});

// ensure each guild/type combo is unique
PointTypeSchema.index({ guildId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('PointType', PointTypeSchema);
