const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { validateReading, SLOT_LABELS } = require('../utils/validateReading');

const router = express.Router();
router.use(auth);

const COLUMNS = 'id, reading_date::text AS date, slot, value';

// Create
router.post('/', async (req, res) => {
  try {
    const { date, slot, value } = req.body || {};
    const error = await validateReading({ userId: req.user.id, date, slot, value });
    if (error) return res.status(400).json({ error });

    const { rows } = await db.query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [req.user.id, date, slot, Number(value)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      const slotLabel = SLOT_LABELS[req.body.slot];
      return res
        .status(400)
        .json({ error: `You already have an ${slotLabel} reading for this date.` });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// List (optionally for one date)
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const params = [req.user.id];
    let where = 'user_id = $1';
    if (date) {
      params.push(date);
      where += ' AND reading_date = $2';
    }
    const { rows } = await db.query(
      `SELECT ${COLUMNS} FROM readings WHERE ${where} ORDER BY reading_date DESC, id`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Edit
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Reading not found.' });

    const existing = await db.query(
      'SELECT id FROM readings WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    const { date, slot, value } = req.body || {};
    const error = await validateReading({
      userId: req.user.id, date, slot, value, excludeId: id,
    });
    if (error) return res.status(400).json({ error });

    const { rows } = await db.query(
      `UPDATE readings SET reading_date = $1, slot = $2, value = $3
       WHERE id = $4 AND user_id = $5 RETURNING ${COLUMNS}`,
      [date, slot, Number(value), id, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      const slotLabel = SLOT_LABELS[req.body.slot];
      return res
        .status(400)
        .json({ error: `You already have an ${slotLabel} reading for this date.` });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Reading not found.' });

    const { rowCount } = await db.query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Reading not found.' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;