// scripts/fixPointTypes.js
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const coll = mongoose.connection.db.collection('pointtypes');

  // Rename any "type" fields to "name"
  const cursor = coll.find({ type: { $exists: true } });
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    await coll.updateOne(
      { _id: doc._id },
      { $set: { name: doc.type }, $unset: { type: "" } }
    );
    console.log(`✅ Fixed doc ${doc._id}: moved type -> name`);
  }

  // Drop wrong index if it exists
  const indexes = await coll.indexes();
  if (indexes.some(i => i.name === 'guildId_1_type_1')) {
    await coll.dropIndex('guildId_1_type_1');
    console.log('🗑️ Dropped bad index guildId_1_type_1');
  }

  // Ensure correct index
  await coll.createIndex({ guildId: 1, name: 1 }, { unique: true });
  console.log('🔒 Ensured unique index on { guildId, name }');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
