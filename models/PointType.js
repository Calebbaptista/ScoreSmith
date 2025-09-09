const mongoose = require('mongoose');

const pointTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  guildId: { type: String, required: true }
});

module.exports = mongoose.model('PointType', pointTypeSchema);
