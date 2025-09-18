const mongoose = require('mongoose');

const PointTypeSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  type:    { type: String, required: true, unique: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PointType', PointTypeSchema);
