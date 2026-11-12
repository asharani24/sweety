const { request, app, db, resetDb, registerUser, closeDb } = require('./helpers');

beforeEach(resetDb);
afterAll(closeDb);

describe('Auth', () => {
  test('register stores a bcrypt hash, not the plain password', async () => {
    const { res } = await registerUser({ password: 'secret123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.password_hash).toBeUndefined();

    const { rows } = await db.query('SELECT password_hash FROM users WHERE email = $1', [
      'user@example.com',
    ]);
    expect(rows[0].password_hash).not.toBe('secret123');
    expect(rows[0].password_hash.startsWith('$2')).toBe(true);
  });

  test('login returns a token for correct credentials', async () => {
    await registerUser();
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('login fails with a wrong password', async () => {
    await registerUser();
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  test('registering the same email twice returns 409', async () => {
    await registerUser();
    const { res } = await registerUser();
    expect(res.status).toBe(409);
  });

  test('readings require a login token', async () => {
    const res = await request(app).get('/readings');
    expect(res.status).toBe(401);
  });
});