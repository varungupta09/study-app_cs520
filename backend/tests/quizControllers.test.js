const request = require('supertest');
const app = require('../src/server');
const db = require('../src/database');

describe('Quiz Controllers', () => {
  let userId;
  let quizId;

  beforeAll((done) => {
    // Insert a test user into the database
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['testuser', 'password123'], function(err) {
      if (err) return done(err);
      userId = this.lastID;

      // Insert a test quiz into the database
      db.run('INSERT INTO quizzes (study_set_id, quiz_content) VALUES (?, ?)', [1, '{"questions": []}'], function(err) {
        if (err) return done(err);
        quizId = this.lastID;
        done();
      });
    });
  });

  beforeEach((done) => {
    // Clean up the quiz_scores table before each test
    db.run('DELETE FROM quiz_scores', done);
  });

  afterEach((done) => {
    // Clean up the quiz_scores table after each test
    db.run('DELETE FROM quiz_scores', done);
  });

  afterAll((done) => {
    // Clean up the database
    db.run('DELETE FROM quizzes WHERE id = ?', [quizId], (err) => {
      if (err) return done(err);
      db.run('DELETE FROM users WHERE id = ?', [userId], done);
    });
  });

  it('should save a quiz score', async () => {
    const response = await request(app)
      .post('/api/quizzes/scores')
      .send({ userId, quizId, score: 85 });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Quiz score saved successfully');
    expect(response.body).toHaveProperty('scoreId');
  });

  it('should return 400 if required fields are missing', async () => {
    const response = await request(app)
      .post('/api/quizzes/scores')
      .send({ userId, score: 85 });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing required fields: userId, quizId, score');
  });

  it('should retrieve quiz scores', async () => {
    // Insert a test score into the database with a unique taken_date
    const takenDate = new Date().toISOString();
    await new Promise((resolve, reject) => {
      db.run('INSERT INTO quiz_scores (user_id, quiz_id, score, taken_date) VALUES (?, ?, ?, ?)', [userId, quizId, 90, takenDate], function(err) {
        if (err) return reject(err);
        resolve();
      });
    });

    const response = await request(app).get(`/api/quizzes/${quizId}/scores`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Quiz scores retrieved successfully');
    expect(response.body.scores).toHaveLength(1);
    expect(response.body.scores[0]).toHaveProperty('score', 90);
  });
});