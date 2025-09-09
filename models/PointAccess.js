const mongoose = require('mongoose');

const pointAccessSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  type: { type: String, required: true }, // Point type name
  allowedRoles: [{ type: String }] // Array of role IDs
});

module.exports = mongoose.model('PointAccess', pointAccessSchema);
