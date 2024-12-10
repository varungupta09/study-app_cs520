const request = require('supertest');
const app = require('../src/server');
const db = require('../src/database');

describe('Share Controllers', () => {
  let studySetId;
  let sharedWithUserId;
  let sharedByUserId;

  beforeAll((done) => {
    // Insert test users and a study set into the database
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['sharedByUser', 'password123'], function(err) {
      if (err) return done(err);
      sharedByUserId = this.lastID;

      db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['sharedWithUser', 'password123'], function(err) {
        if (err) return done(err);
        sharedWithUserId = this.lastID;

        db.run('INSERT INTO study_sets (name, description, user_id) VALUES (?, ?, ?)', ['Test Study Set', 'Description', sharedByUserId], function(err) {
          if (err) return done(err);
          studySetId = this.lastID;
          done();
        });
      });
    });
  });

  afterAll((done) => {
    // Clean up the database
    db.run('DELETE FROM study_set_shares WHERE study_set_id = ?', [studySetId], (err) => {
      if (err) return done(err);
      db.run('DELETE FROM study_sets WHERE id = ?', [studySetId], (err) => {
        if (err) return done(err);
        db.run('DELETE FROM users WHERE id IN (?, ?)', [sharedByUserId, sharedWithUserId], done);
      });
    });
  });

  it('should share a study set', async () => {
    const response = await request(app)
      .post('/api/share')
      .send({ studySetId, sharedWithUsername: 'sharedWithUser', sharedByUserId });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Study set shared successfully.');
  });

  it('should return 404 if user not found', async () => {
    const response = await request(app)
      .post('/api/share')
      .send({ studySetId, sharedWithUsername: 'nonExistentUser', sharedByUserId });
    expect(response.status).toBe(404);
    expect(response.text).toBe('User not found.');
  });

  it('should return 400 if study set already shared with the user', async () => {
    // First share the study set
    await request(app)
      .post('/api/share')
      .send({ studySetId, sharedWithUsername: 'sharedWithUser', sharedByUserId });

    // Try sharing again to trigger the unique constraint error
    const response = await request(app)
      .post('/api/share')
      .send({ studySetId, sharedWithUsername: 'sharedWithUser', sharedByUserId });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Study set already shared with this user.');
  });

  it('should return 500 if there is a database error while sharing', async () => {
    // Mock db.run to simulate a database error
    const originalDbRun = db.run;
    db.run = (query, params, callback) => {
      callback(new Error('Simulated database error'));
    };

    const response = await request(app)
      .post('/api/share')
      .send({ studySetId, sharedWithUsername: 'sharedWithUser', sharedByUserId });
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Error sharing study set.');

    // Restore original db.run
    db.run = originalDbRun;
  });

  it('should revoke access to a shared study set', async () => {
    // First share the study set
    await request(app)
      .post('/api/share')
      .send({ studySetId, sharedWithUsername: 'sharedWithUser', sharedByUserId });

    // Revoke access
    const response = await request(app)
      .delete('/api/share')
      .send({ studySetId, sharedWithUserId });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Access revoked successfully.');
  });

  it('should return 500 if there is a database error while revoking access', async () => {
    // Mock db.run to simulate a database error
    const originalDbRun = db.run;
    db.run = (query, params, callback) => {
      callback(new Error('Simulated database error'));
    };

    const response = await request(app)
      .delete('/api/share')
      .send({ studySetId, sharedWithUserId });
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Error revoking share.');

    // Restore original db.run
    db.run = originalDbRun;
  });

  it('should fetch study sets shared with a user', async () => {
    // First share the study set
    await request(app)
      .post('/api/share')
      .send({ studySetId, sharedWithUsername: 'sharedWithUser', sharedByUserId });

    // Fetch shared study sets
    const response = await request(app).get(`/api/share/shared-with-me/${sharedWithUserId}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty('name', 'Test Study Set');
  });

  it('should return 500 if there is a database error while fetching shared study sets', async () => {
    // Mock db.all to simulate a database error
    const originalDbAll = db.all;
    db.all = (query, params, callback) => {
      callback(new Error('Simulated database error'));
    };

    const response = await request(app).get(`/api/share/shared-with-me/${sharedWithUserId}`);
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Error fetching shared study sets.');

    // Restore original db.all
    db.all = originalDbAll;
  });
});