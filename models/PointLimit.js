const mongoose = require('mongoose');

const pointLimitSchema = new mongoose.Schema({
  guildId: String,
  limit: Number
});

module.exports = mongoose.model('PointLimit', pointLimitSchema);
