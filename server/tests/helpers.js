process.env.NODE_ENV = 'test';

const request = require('supertest');
const db = require('../src/db');
const app = require('../src/app');

async function resetDb() {
  await db.query('TRUNCATE readings, users RESTART IDENTITY CASCADE');
}

async function registerUser(overrides = {}) {
  const body = {
    name: 'Test User',
    email: 'user@example.com',
    password: 'secret123',
    ...overrides,
  };
  const res = await request(app).post('/auth/register').send(body);
  return { token: res.body.token, user: res.body.user, res };
}

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

async function closeDb() {
  await db.pool.end();
}

module.exports = { request, app, db, resetDb, registerUser, authHeader, closeDb };