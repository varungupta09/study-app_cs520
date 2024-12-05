const request = require('supertest');
const app = require('../src/server');

describe('Share Controllers', () => {
  it('should share a study set', async () => {
    const response = await request(app)
      .post('/api/share')
      .send({ studySetId: 1, sharedWithUserId: 2, sharedByUserId: 1 });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Study set shared successfully.');
  });

  it('should revoke access to a shared study set', async () => {
    const response = await request(app)
      .delete('/api/share')
      .send({ studySetId: 1, sharedWithUserId: 2 });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Access revoked successfully.');
  });
});