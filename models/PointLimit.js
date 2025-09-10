const mongoose = require('mongoose');

const pointLimitSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  type: { type: String, required: true },
  limit: { type: Number, required: true }
});

module.exports = mongoose.model('PointLimit', pointLimitSchema);
