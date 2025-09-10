const mongoose = require('mongoose');

const PointLimitSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  maxAmount: { type: Number, required: true }
});

module.exports = mongoose.model('PointLimit', PointLimitSchema);
