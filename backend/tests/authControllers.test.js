const request = require('supertest');
const app = require('../src/server');
const db = require('../src/database');

let server;
let uniqueUsername;

beforeAll((done) => {
  server = app.listen(5001, done); // Start the server before running tests
  uniqueUsername = `testuser_${Date.now()}@example.com`; // Generate a unique username once
});

afterAll((done) => {
  server.close(done); // Close the server after running tests
});

describe('Auth Controllers', () => {
  it('should sign up a new user', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({ username: uniqueUsername, password: 'password123' });
    expect(response.status).toBe(201);
    expect(response.text).toBe('User created.');
  });

  it('should not sign up a user with an existing email', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ username: uniqueUsername, password: 'password123' });

    const response = await request(app)
      .post('/auth/signup')
      .send({ username: uniqueUsername, password: 'password123' });
    expect(response.status).toBe(409);
    expect(response.text).toBe('Email already in use.');
  });

  it('should log in an existing user', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ username: uniqueUsername, password: 'password123' });

    const response = await request(app)
      .post('/auth/login')
      .send({ username: uniqueUsername, password: 'password123' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('should not log in with incorrect credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'wronguser@example.com', password: 'wrongpassword' });
    expect(response.status).toBe(401);
    expect(response.text).toBe('Invalid credentials.');
  });

  it('should return 400 for invalid email format during signup', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({ username: 'invalidemail.com', password: 'password123' });
    expect(response.status).toBe(400);
    expect(response.text).toBe('Invalid email format.');
  });

  it('should return 400 if username is missing during signup', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({ password: 'password123' });
    expect(response.status).toBe(400);
    expect(response.text).toBe('Email and password are required.');
  });

  it('should return 400 if username is missing during login', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ password: 'password123' });
    expect(response.status).toBe(400);
    expect(response.text).toBe('Email and password are required.');
  });

  it('should return 400 if password is missing during login', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: uniqueUsername });
    expect(response.status).toBe(400);
    expect(response.text).toBe('Email and password are required.');
  });

  it('should return a valid JWT token on login', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ username: uniqueUsername, password: 'password123' });
  
    const response = await request(app)
      .post('/auth/login')
      .send({ username: uniqueUsername, password: 'password123' });
  
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.token).toMatch(/^eyJ/); // JWT token should start with "eyJ"
  });
});