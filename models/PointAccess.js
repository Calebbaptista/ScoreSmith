const mongoose = require('mongoose');

const pointAccessSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  type: { type: String, required: true },
  allowedRoles: [{ type: String }]
});

module.exports = mongoose.model('PointAccess', pointAccessSchema);
