const request = require('supertest');
const app = require('../src/server'); // Assuming your Express app is exported from server.js

describe('Study Controllers', () => {
  let studySetId;

  it('should create a new study set', async () => {
    const response = await request(app)
      .post('/api/study-set')
      .send({ userId: 1, name: 'New Study Set', description: 'Description' });
    expect(response.status).toBe(201);
    studySetId = response.body.id;
  });

  it('should fetch study set details', async () => {
    const response = await request(app).get(`/api/study-set/${studySetId}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name');
  });

  it('should update a study set', async () => {
    const response = await request(app)
      .put(`/api/study-set/${studySetId}`)
      .send({ name: 'Updated Study Set', description: 'Updated Description' });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Study set updated successfully without files.');
  });

  it('should delete a study set', async () => {
    const response = await request(app).delete(`/api/study-set/${studySetId}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Study set deleted successfully.');
  });
});