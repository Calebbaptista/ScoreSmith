// scripts/clearPointTypes.js
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const coll = mongoose.connection.db.collection('pointtypes');

  // Delete all point types for all guilds
  const result = await coll.deleteMany({});
  console.log(`🗑️ Deleted ${result.deletedCount} point types`);

  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
