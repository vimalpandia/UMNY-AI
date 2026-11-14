const request = require('supertest');
const app = require('../src/app');

describe('UMNY AI Authentication & System Health API', () => {
  it('GET /api/health should return system status healthy and UMNY AI tagline', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('healthy');
    expect(res.body.product).toEqual('UMNY AI');
    expect(res.body.tagline).toContain('Your Intelligence');
  });

  it('GET /api/models should list available AI models with Groq as default', async () => {
    const res = await request(app).get('/api/models');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body[0].id).toEqual('llama-3.3-70b-versatile');
    expect(res.body[0].provider).toEqual('Groq');
    const modelIds = res.body.map((m) => m.id);
    expect(modelIds).toContain('llama-3.3-70b-versatile');
    expect(modelIds).toContain('gemini-2.5-flash');
    expect(modelIds).toContain('gpt-4o');
    expect(modelIds).toContain('claude-3-5-sonnet');
  });

  it('POST /api/auth/register should create a new user account and return JWT token', async () => {
    const uniqueEmail = `tester_${Date.now()}@umny.ai`;
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Engineer',
      email: uniqueEmail,
      password: 'Password@123',
    });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', uniqueEmail);
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/login should authenticate user and reject incorrect password', async () => {
    const uniqueEmail = `login_test_${Date.now()}@umny.ai`;
    // First register
    await request(app).post('/api/auth/register').send({
      name: 'Login User',
      email: uniqueEmail,
      password: 'CorrectPassword123',
    });

    // Attempt wrong password
    const failRes = await request(app).post('/api/auth/login').send({
      email: uniqueEmail,
      password: 'WrongPassword123',
    });
    expect(failRes.statusCode).toEqual(401);

    // Attempt correct password
    const successRes = await request(app).post('/api/auth/login').send({
      email: uniqueEmail,
      password: 'CorrectPassword123',
    });
    expect(successRes.statusCode).toEqual(200);
    expect(successRes.body).toHaveProperty('token');
  });

  it('ALL /api/unmatched-endpoint should return structured 404 JSON error', async () => {
    const res = await request(app).get('/api/unmatched-endpoint');
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('API endpoint not found');
  });
});

