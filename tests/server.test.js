const request = require('supertest');
const { app, resetUsers, findUserByUsername, findUserById, isPasswordValid } = require('../src/server');

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

// ─── POST /api/search ─────────────────────────────────────────────────────────

describe('POST /api/search', () => {
  test('returns found user by username', async () => {
    const res = await request(app).post('/api/search').send({ username: 'admin' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ id: 1, username: 'admin' });
    expect(res.body.password).toBeUndefined();
  });

  test('returns 404 when user is not found', async () => {
    const res = await request(app).post('/api/search').send({ username: 'unknown' });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBeTruthy();
  });
});

// ─── Unit: findUserByUsername ─────────────────────────────────────────────────

describe('findUserByUsername', () => {
  const users = [
    { id: 1, username: 'admin', password: 'admin' },
    { id: 2, username: 'Yehor', password: 'DevOps' },
  ];

  test('finds existing user by username', () => {
    const result = findUserByUsername(users, 'admin');
    expect(result).toMatchObject({ id: 1, username: 'admin' });
  });

  test('returns undefined for non-existing username', () => {
    const result = findUserByUsername(users, 'ghost');
    expect(result).toBeUndefined();
  });

  test('search is case-sensitive — wrong case returns undefined', () => {
    const result = findUserByUsername(users, 'Admin');
    expect(result).toBeUndefined();
  });
});

// ─── Unit: findUserById ───────────────────────────────────────────────────────

describe('findUserById', () => {
  const users = [
    { id: 1, username: 'admin', password: 'admin' },
    { id: 2, username: 'Yehor', password: 'DevOps' },
  ];

  test('finds existing user by numeric string id', () => {
    const result = findUserById(users, '1');
    expect(result).toMatchObject({ id: 1, username: 'admin' });
  });

  test('returns undefined for non-existing id', () => {
    const result = findUserById(users, '999');
    expect(result).toBeUndefined();
  });

  test('returns undefined for non-numeric id', () => {
    const result = findUserById(users, 'abc');
    expect(result).toBeUndefined();
  });
});

// ─── Unit: isPasswordValid ────────────────────────────────────────────────────

describe('isPasswordValid', () => {
  const user = { id: 1, username: 'admin', password: 'secret' };

  test('returns true for correct password', () => {
    expect(isPasswordValid(user, 'secret')).toBe(true);
  });

  test('returns false for wrong password', () => {
    expect(isPasswordValid(user, 'wrong')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isPasswordValid(user, '')).toBe(false);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  test('POST /api/login — missing body returns 404', async () => {
    const res = await request(app).post('/api/login').send({});
    expect(res.statusCode).toBe(404);
  });

  test('POST /api/search — case-sensitive: ADMIN not found', async () => {
    const res = await request(app).post('/api/search').send({ username: 'ADMIN' });
    expect(res.statusCode).toBe(404);
  });

  test('GET /api/user/:id — non-numeric id returns 404', async () => {
    const res = await request(app).get('/api/user/abc');
    expect(res.statusCode).toBe(404);
  });

  test('POST /api/register — registered user is searchable', async () => {
    await request(app).post('/api/register').send({ username: 'tester', password: '1234' });

    const res = await request(app).post('/api/search').send({ username: 'tester' });
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('tester');
  });

  test('POST /api/register — new user gets incremented id', async () => {
    await request(app).post('/api/register').send({ username: 'userA', password: 'pass' });
    await request(app).post('/api/register').send({ username: 'userB', password: 'pass' });

    const resA = await request(app).post('/api/search').send({ username: 'userA' });
    const resB = await request(app).post('/api/search').send({ username: 'userB' });

    expect(resB.body.id).toBe(resA.body.id + 1);
  });
});
