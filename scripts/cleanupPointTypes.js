// scripts/cleanupPointTypes.js

const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  // 1️⃣ Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  const db   = mongoose.connection.db;
  const coll = db.collection('pointtypes');

  // 2️⃣ Delete all documents where name is null
  const delResult = await coll.deleteMany({ name: null });
  console.log(`🗑️ Deleted ${delResult.deletedCount} documents with name:null`);

  // 3️⃣ Drop the old single-field name_1 index if it exists
  const indexes = await coll.indexes();
  if (indexes.some(idx => idx.name === 'name_1')) {
    await coll.dropIndex('name_1');
    console.log('⚙️ Dropped old index: name_1');
  }

  // 4️⃣ Create a composite unique index on { guildId, name }
  await coll.createIndex(
    { guildId: 1, name: 1 },
    { unique: true, name: 'guildId_1_name_1' }
  );
  console.log('✨ Created unique index on { guildId, name }');

  process.exit(0);
}

run().catch(err => {
  console.error('❌ Cleanup script error:', err);
  process.exit(1);
});
