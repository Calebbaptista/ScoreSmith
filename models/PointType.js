const mongoose = require('mongoose');

const pointTypeSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  name: { type: String, required: true }
});

module.exports = mongoose.model('PointType', pointTypeSchema);
