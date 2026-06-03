const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const axios = require('axios');
const app = require('../src/app');
const Task = require('../src/models/task.model');
const { syncDataset } = require('../src/services/sync.service');

jest.mock('axios');

describe('Sync service and API', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
    process.env.EXTERNAL_API_BASE_URL = 'https://t4e-demotestserver.onrender.com/api';
    process.env.STUDENT_ID = 'student123';
    process.env.STUDENT_PASSWORD = 'password123';
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    await Task.deleteMany({});
  });

  it('fetches token and syncs valid dataset records', async () => {
    axios.post.mockResolvedValue({ data: { token: 'jwt-token' } });
    axios.get.mockResolvedValue({ data: [{ id: '1', title: 'Task One', status: 'pending', priority: 'high' }, { id: '2', title: '', status: 'completed', priority: 'low' }] });

    const result = await syncDataset();

    expect(result).toEqual({ success: true, totalFetched: 2, inserted: 1, duplicates: 0, rejected: 1 });
    const tasks = await Task.find({});
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Task One');
  });

  it('prevents duplicate insertion during sync', async () => {
    axios.post.mockResolvedValue({ data: { token: 'jwt-token' } });
    axios.get.mockResolvedValue({ data: [{ id: '1', title: 'Task One', status: 'pending', priority: 'high' }, { id: '1', title: 'Task One Updated', status: 'completed', priority: 'medium' }] });

    const result = await syncDataset();

    expect(result).toEqual({ success: true, totalFetched: 2, inserted: 1, duplicates: 1, rejected: 0 });
    const tasks = await Task.find({});
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Task One');
  });

  it('supports the /api/sync endpoint', async () => {
    axios.post.mockResolvedValue({ data: { token: 'jwt-token' } });
    axios.get.mockResolvedValue({ data: [{ id: '1', title: 'Task One', status: 'pending', priority: 'high' }] });

    const response = await request(app).post('/api/sync');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.inserted).toBe(1);
  });
});
