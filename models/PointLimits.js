const mongoose = require('mongoose');
module.exports = mongoose.model('PointLimit', {
  guildId: String,
  maxAmount: Number
});
