const mongoose = require('mongoose');

module.exports = mongoose.model('PointLimit', {
  guildId: { type: String, required: true },
  maxAmount: { type: Number, required: true }
});
