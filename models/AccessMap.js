const mongoose = require('mongoose');

const AccessMapSchema = new mongoose.Schema({
  guildId:      { type: String, required: true },
  type:         { type: String, required: true },
  allowedRoles: { type: [String], default: [] }
});

module.exports = mongoose.model('AccessMap', AccessMapSchema);
