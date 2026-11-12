require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./src/db');

const DEMO_EMAIL = 'demo@sweety.com';
const DEMO_PASSWORD = 'Demo@1234';
const SLOTS = ['morning', 'after_breakfast', 'after_lunch', 'after_dinner'];

// Value range per slot (mg/dl), so the numbers look realistic
const RANGES = {
  morning: [85, 125],
  after_breakfast: [120, 190],
  after_lunch: [110, 180],
  after_dinner: [115, 185],
};

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function dateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-CA');
}

async function seed() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Create the demo user, or reuse it if it already exists
  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ('Demo User', $1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [DEMO_EMAIL, hash]
  );
  const userId = rows[0].id;

  // Clear old demo readings so the script can be run again
  await db.query('DELETE FROM readings WHERE user_id = $1', [userId]);

  // About 50 days of data, so both this month and the previous month have readings
  let count = 0;
  for (let daysAgo = 0; daysAgo < 50; daysAgo++) {
    const date = dateStr(daysAgo);
    // Every 4th day has fewer than 4 readings (1 to 3)
    const perDay = daysAgo % 4 === 3 ? rand(1, 3) : 4;
    const slots = [...SLOTS].sort(() => Math.random() - 0.5).slice(0, perDay);

    for (const slot of slots) {
      const [min, max] = RANGES[slot];
      await db.query(
        'INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)',
        [userId, date, slot, rand(min, max)]
      );
      count++;
    }
  }

  console.log(`Seeded ${DEMO_EMAIL} / ${DEMO_PASSWORD} with ${count} readings.`);
  await db.pool.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});