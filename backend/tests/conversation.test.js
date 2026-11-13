const request = require('supertest');
const app = require('../src/app');

describe('UMNY AI Conversations & Memory API', () => {
  let token;
  let user;

  beforeAll(async () => {
    const email = `conv_tester_${Date.now()}@umny.ai`;
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Conversation Tester',
      email,
      password: 'StrongPassword@123',
    });
    token = regRes.body.token;
    user = regRes.body.user;
  });

  it('POST /api/conversations should create a new conversation for authenticated user', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Project Architecture Planning',
        selectedModel: 'gemini-2.5-flash',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toEqual('Project Architecture Planning');
  });

  it('GET /api/conversations should list conversations for user', async () => {
    const res = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('POST /api/memories should save user-approved long term memory', async () => {
    const res = await request(app)
      .post('/api/memories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Prefers solutions structured in modular TypeScript and clean microservices.',
        category: 'preference',
        importance: 5,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.content).toContain('modular TypeScript');
  });

  it('GET /api/memories should retrieve user memories', async () => {
    const res = await request(app)
      .get('/api/memories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/agents/tools should return available tools', async () => {
    const res = await request(app)
      .get('/api/agents/tools')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    const names = res.body.map((t) => t.id);
    expect(names).toContain('web_search');
    expect(names).toContain('calculator');
    expect(names).toContain('file_analysis');
    expect(names).toContain('document_summarizer');
  });
});
