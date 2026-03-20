const request = require('supertest');
const { app, resetUsers } = require('../server');

beforeEach(() => {
  resetUsers();
});

// ─── POST /api/login ──────────────────────────────────────────────────────────

describe('POST /api/login', () => {
  test('successful login — returns user data', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'admin' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ id: 1, username: 'admin' });
    expect(res.body.password).toBeUndefined();
  });

  test('user not found — 404', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'nobody', password: 'pass' });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBeTruthy();
  });

  test('wrong password — 401', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'wrong' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBeTruthy();
  });
});

// ─── POST /api/register ───────────────────────────────────────────────────────

describe('POST /api/register', () => {
  test('successful registration of a new user — 200', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'newuser', password: 'newpass' });

    expect(res.statusCode).toBe(200);
  });

  test('duplicate registration — 409', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'admin', password: 'anypass' });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBeTruthy();
  });

  test('registered user can log in', async () => {
    await request(app).post('/api/register').send({ username: 'newuser', password: 'newpass' });

    const res = await request(app)
      .post('/api/login')
      .send({ username: 'newuser', password: 'newpass' });

    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('newuser');
  });

  test('state is reset between tests — no cross-test pollution', async () => {
    // newuser should not exist (resetUsers ran before this test)
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'newuser', password: 'newpass' });

    expect(res.statusCode).toBe(404);
  });
});

// ─── GET /api/user/:id ────────────────────────────────────────────────────────

describe('GET /api/user/:id', () => {
  test('returns data for an existing user', async () => {
    const res = await request(app).get('/api/user/1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ id: 1, username: 'admin' });
    expect(res.body.password).toBeUndefined();
  });

  test('user not found — 404', async () => {
    const res = await request(app).get('/api/user/9999');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBeTruthy();
  });
});

// ─── GET /user/:id ────────────────────────────────────────────────────────────

describe('GET /user/:id', () => {
  test('returns HTML page for an existing user', async () => {
    const res = await request(app).get('/user/1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  test('user not found — 404', async () => {
    const res = await request(app).get('/user/9999');

    expect(res.statusCode).toBe(404);
  });
});
