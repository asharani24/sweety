const fs = require('fs');
const path = require('path');
const db = require('./index');

async function init() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.query(sql);
  console.log('Database schema created.');
  await db.pool.end();
}

init().catch((err) => {
  console.error('Schema creation failed:', err.message);
  process.exit(1);
});