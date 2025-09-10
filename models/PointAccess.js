const mongoose = require('mongoose');

const pointAccessSchema = new mongoose.Schema({
  guildId: String,
  roleId: String,
  types: [String]
});

module.exports = mongoose.model('PointAccess', pointAccessSchema);
