const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const http = require('http');

test('Authentication Middleware', async (t) => {
  let app;
  let server;

  t.before(() => {
    process.env.ORCHESTRATOR_API_KEY = 'secret';
    process.env.ORCHESTRATOR_PORT = '0';
    app = require('../src/server.js');
  });

  t.after(() => {
    setTimeout(() => process.exit(0), 50);
  });

  await t.test('bypasses normal endpoints', async () => {
    const res = await request(app).get('/dashboard');
    assert.notEqual(res.status, 401);
  });

  await t.test('blocks uppercase path bypass', async () => {
    const res = await request(app).post('/V1/chat/completions').send({ messages: [], model: 'auto' });
    assert.equal(res.status, 401);
  });

  await t.test('blocks duplicate slashes bypass', async () => {
    const res = await request(app).post('//v1/chat/completions').send({ messages: [], model: 'auto' });
    assert.equal(res.status, 401);
  });

  await t.test('allows valid token', async () => {
    // We shouldn't actually route, just check that it hits the router and gets a 502/400 instead of 401
    const res = await request(app)
      .post('/v1/chat/completions')
      .set('Authorization', 'Bearer secret')
      .send({ messages: [{ role: 'user', content: 'hi' }], model: 'auto' });
    assert.notEqual(res.status, 401);
    // Since we didn't mock, it will fail routing, but that's fine as long as it's not 401.
  });
});
