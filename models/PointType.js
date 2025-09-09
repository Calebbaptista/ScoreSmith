const mongoose = require('mongoose');

const pointTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  guildId: { type: String, required: true }
});

pointTypeSchema.index({ name: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model('PointType', pointTypeSchema);
