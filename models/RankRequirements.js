const mongoose = require('mongoose');

const rankRequirementSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  rankRoleId: { type: String, required: true },
  requiredRoleIds: { type: [String], default: [] }
});

module.exports = mongoose.model('RankRequirement', rankRequirementSchema);
