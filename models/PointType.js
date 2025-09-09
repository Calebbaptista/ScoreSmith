const mongoose = require('mongoose');

const pointTypeSchema = new mongoose.Schema({
  guildId: String,
  name: String
});

module.exports = mongoose.model('PointType', pointTypeSchema);
