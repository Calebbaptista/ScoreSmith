const mongoose = require('mongoose');
const pointTypeSchema = new mongoose.Schema({
  guildId: String,
  type: String
});
module.exports = mongoose.model('PointType', pointTypeSchema);
