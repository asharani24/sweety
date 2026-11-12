const db = require('../db');

const SLOT_LABELS = {
  morning: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

function today() {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: process.env.APP_TZ || 'Asia/Kolkata',
  });
}

// Returns an error message string, or null if the reading is valid.
async function validateReading({ userId, date, slot, value, excludeId = null }) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return 'Please enter a glucose value.';
  }

  const n = Number(value);
  if (!Number.isInteger(n) || n < 40 || n > 600) {
    return 'Value must be between 40 and 600 mg/dl.';
  }

  if (!SLOT_LABELS[slot]) return 'Please select a valid time slot.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return 'Please select a valid date.';
  if (date > today()) return 'Date cannot be in the future.';

  const { rows } = await db.query(
    `SELECT slot FROM readings
     WHERE user_id = $1 AND reading_date = $2 AND ($3::int IS NULL OR id <> $3)`,
    [userId, date, excludeId]
  );

  if (rows.length >= 4) return 'You can add only 4 readings per day.';
  if (rows.some((r) => r.slot === slot)) {
    return `You already have an ${SLOT_LABELS[slot]} reading for this date.`;
  }

  return null;
}

module.exports = { validateReading, SLOT_LABELS, today };