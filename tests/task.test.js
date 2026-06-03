const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Task = require('../src/models/task.model');

describe('Task CRUD API', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Task.deleteMany({});
  });

  it('creates, reads, updates, and deletes a task', async () => {
    const createResponse = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test Task', description: 'Test details', status: 'pending', priority: 'medium' });

    expect(createResponse.status).toBe(200);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data.title).toBe('Test Task');

    const taskId = createResponse.body.data._id;

    const getResponse = await request(app).get(`/api/tasks/${taskId}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data._id).toBe(taskId);

    const updateResponse = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ status: 'completed', priority: 'high' });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.status).toBe('completed');
    expect(updateResponse.body.data.priority).toBe('high');

    const deleteResponse = await request(app).delete(`/api/tasks/${taskId}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);

    const missingResponse = await request(app).get(`/api/tasks/${taskId}`);
    expect(missingResponse.status).toBe(404);
  });

  it('filters tasks by status and search query', async () => {
    await Task.create([
      { title: 'Meeting', description: 'Team sync', status: 'pending', priority: 'high' },
      { title: 'Deploy', description: 'Production rollout', status: 'completed', priority: 'medium' },
    ]);

    const statusResponse = await request(app).get('/api/tasks').query({ status: 'pending' });
    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.data).toHaveLength(1);
    expect(statusResponse.body.data[0].title).toBe('Meeting');

    const searchResponse = await request(app).get('/api/tasks/search').query({ search: 'prod' });
    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.data).toHaveLength(1);
    expect(searchResponse.body.data[0].title).toBe('Deploy');
  });
});
