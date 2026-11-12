const { request, app, resetDb, registerUser, authHeader, closeDb } = require('./helpers');

beforeEach(resetDb);
afterAll(closeDb);

const DATE = '2026-11-10'; // a past date, so it is never "in the future"

async function addReading(token, body) {
  return request(app).post('/readings').set(authHeader(token)).send(body);
}

describe('Reading validation', () => {
  let token;
  beforeEach(async () => {
    ({ token } = await registerUser());
  });

  test('a valid reading is created', async () => {
    const res = await addReading(token, { date: DATE, slot: 'morning', value: 110 });
    expect(res.status).toBe(201);
    expect(res.body.value).toBe(110);
  });

  test('missing value', async () => {
    const res = await addReading(token, { date: DATE, slot: 'morning', value: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Please enter a glucose value.');
  });

  test.each([39, 601, 120.5])('value %p is rejected', async (value) => {
    const res = await addReading(token, { date: DATE, slot: 'morning', value });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');
  });

  test('future date', async () => {
    const res = await addReading(token, { date: '2999-01-01', slot: 'morning', value: 110 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Date cannot be in the future.');
  });

  test('duplicate slot on the same day', async () => {
    await addReading(token, { date: DATE, slot: 'after_lunch', value: 140 });
    const res = await addReading(token, { date: DATE, slot: 'after_lunch', value: 150 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('You already have an After lunch reading for this date.');
  });

  test('a 5th reading in one day is rejected', async () => {
    const slots = ['morning', 'after_breakfast', 'after_lunch', 'after_dinner'];
    for (const slot of slots) {
      const ok = await addReading(token, { date: DATE, slot, value: 120 });
      expect(ok.status).toBe(201);
    }
    const res = await addReading(token, { date: DATE, slot: 'morning', value: 100 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('You can add only 4 readings per day.');
  });
});

describe('User isolation', () => {
  test("user A cannot read, edit or delete user B's reading", async () => {
    const a = await registerUser({ email: 'a@example.com' });
    const b = await registerUser({ email: 'b@example.com' });

    const created = await addReading(b.token, { date: DATE, slot: 'morning', value: 110 });
    const id = created.body.id;

    // A's list does not include B's reading
    const list = await request(app).get('/readings').set(authHeader(a.token));
    expect(list.body).toHaveLength(0);

    // A cannot edit it
    const put = await request(app)
      .put(`/readings/${id}`)
      .set(authHeader(a.token))
      .send({ date: DATE, slot: 'morning', value: 200 });
    expect(put.status).toBe(404);

    // A cannot delete it
    const del = await request(app).delete(`/readings/${id}`).set(authHeader(a.token));
    expect(del.status).toBe(404);

    // B's reading is unchanged
    const bList = await request(app).get('/readings').set(authHeader(b.token));
    expect(bList.body).toHaveLength(1);
    expect(bList.body[0].value).toBe(110);
  });
});