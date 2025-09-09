const mongoose = require('mongoose');

const pointTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  guildId: { type: String, required: true },
  requiredRoleIds: [{ type: String }] // Optional role restrictions
});

pointTypeSchema.index({ name: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model('PointType', pointTypeSchema);
