const request = require('supertest');
const app = require('../src/server');
const db = require('../src/database');

describe('Chat Controllers', () => {
  let studySetId;
  let userId;

  beforeAll((done) => {
    // Clean up any existing test data
    db.run('DELETE FROM study_set_chats', (err) => {
      if (err) return done(err);
      db.run('DELETE FROM study_sets', (err) => {
        if (err) return done(err);
        db.run('DELETE FROM users', (err) => {
          if (err) return done(err);

          // Insert a test user and study set into the database
          db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['testuser', 'password123'], function(err) {
            if (err) return done(err);
            userId = this.lastID;
            db.run('INSERT INTO study_sets (name, description, user_id) VALUES (?, ?, ?)', ['Test Study Set', 'Description', userId], function(err) {
              if (err) return done(err);
              studySetId = this.lastID;
              done();
            });
          });
        });
      });
    });
  });

  beforeEach((done) => {
    // Clean up the study_set_chats table before each test
    db.run('DELETE FROM study_set_chats', done);
  });

  afterEach((done) => {
    // Clean up the study_set_chats table after each test
    db.run('DELETE FROM study_set_chats', done);
  });

  afterAll((done) => {
    // Clean up the database
    db.run('DELETE FROM study_sets WHERE id = ?', [studySetId], (err) => {
      if (err) return done(err);
      db.run('DELETE FROM users WHERE id = ?', [userId], done);
    });
  });

  it('should fetch messages for a study set', async () => {
    // Insert a test message into the database
    await new Promise((resolve, reject) => {
      db.run('INSERT INTO study_set_chats (study_set_id, user_id, message, timestamp) VALUES (?, ?, ?, ?)', [studySetId, userId, 'Test message', new Date().toISOString()], function(err) {
        if (err) return reject(err);
        resolve();
      });
    });

    const response = await request(app).get(`/api/chats/${studySetId}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty('message', 'Test message');
  });

  it('should post a new message to a study set chat', async () => {
    const postResponse = await request(app)
      .post(`/api/chats/${studySetId}`)
      .send({ studySetId, userId, message: 'New test message' });
    expect(postResponse.status).toBe(201);
    expect(postResponse.body).toHaveProperty('message', 'New test message');

    const getResponse = await request(app).get(`/api/chats/${studySetId}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toHaveLength(1);
    expect(getResponse.body[0]).toHaveProperty('message', 'New test message');
  });

  it('should return 400 if user ID or message is missing', async () => {
    const response = await request(app)
      .post(`/api/chats/${studySetId}`)
      .send({ studySetId, message: 'Incomplete message' });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'User ID and message are required');
  });

  it('should handle error when fetching messages', async () => {
    // Mock db.all to simulate an error
    const originalDbAll = db.all;
    db.all = (query, params, callback) => {
      callback(new Error('Simulated database error'));
    };

    const response = await request(app).get(`/api/chats/${studySetId}`);
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Internal server error');

    // Restore original db.all
    db.all = originalDbAll;
  });

  it('should handle error when posting a message', async () => {
    // Mock db.run to simulate an error
    const originalDbRun = db.run;
    db.run = (query, params, callback) => {
      callback(new Error('Simulated database error'));
    };

    const response = await request(app)
      .post(`/api/chats/${studySetId}`)
      .send({ studySetId, userId, message: 'New test message' });
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Internal server error');

    // Restore original db.run
    db.run = originalDbRun;
  });
});