const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { SLOT_LABELS, today } = require('../utils/validateReading');

const router = express.Router();
router.use(auth);

const SLOT_ORDER = Object.keys(SLOT_LABELS);

function isValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return false;
  return new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
}

// Reads ?date=YYYY-MM-DD (defaults to today). Sends a 400 and returns null if invalid.
function getDate(req, res) {
  const date = req.query.date || today();
  if (!isValidDate(date)) {
    res.status(400).json({ error: 'Please select a valid date.' });
    return null;
  }
  return date;
}

async function stats(userId, from, to) {
  const { rows } = await db.query(
    `SELECT MAX(value) AS highest, MIN(value) AS lowest,
            ROUND(AVG(value)::numeric, 1) AS average, COUNT(*)::int AS count
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, from, to]
  );
  const r = rows[0];
  if (r.count === 0) return { count: 0, highest: null, lowest: null, average: null };
  return {
    count: r.count,
    highest: r.highest,
    lowest: r.lowest,
    average: parseFloat(r.average),
  };
}

// Daily: the selected date, plus the list of readings with slots
router.get('/daily', async (req, res) => {
  try {
    const date = getDate(req, res);
    if (!date) return;

    const summary = await stats(req.user.id, date, date);
    const { rows } = await db.query(
      `SELECT id, slot, value FROM readings
       WHERE user_id = $1 AND reading_date = $2`,
      [req.user.id, date]
    );
    const readings = rows
      .map((r) => ({ ...r, slotLabel: SLOT_LABELS[r.slot] }))
      .sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));

    res.json({ range: { from: date, to: date }, ...summary, readings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Month-to-date: 1st of the month up to the selected date
router.get('/month-to-date', async (req, res) => {
  try {
    const date = getDate(req, res);
    if (!date) return;

    const from = date.slice(0, 8) + '01';
    const summary = await stats(req.user.id, from, date);
    res.json({ range: { from, to: date }, ...summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Monthly: the whole month before the selected date's month
router.get('/monthly', async (req, res) => {
  try {
    const date = getDate(req, res);
    if (!date) return;

    const [y, m] = date.split('-').map(Number); // m is 1-12
    const from = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
    const to = new Date(Date.UTC(y, m - 1, 0)).toISOString().slice(0, 10);

    const summary = await stats(req.user.id, from, to);
    res.json({ range: { from, to }, ...summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;