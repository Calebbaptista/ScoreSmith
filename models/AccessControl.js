const mongoose = require('mongoose');

const accessControlSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  category: { type: String, enum: ['points', 'ratings'], required: true },
  action: { type: String, enum: ['add', 'remove', 'rate', 'delete', 'view'], required: true },
  allowedRoleIds: { type: [String], default: [] }
});

module.exports = mongoose.model('AccessControl', accessControlSchema);
