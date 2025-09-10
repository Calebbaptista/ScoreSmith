const mongoose = require('mongoose');

const PointTypeSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  name: { type: String, required: true }
});

module.exports = mongoose.model('PointType', PointTypeSchema);
