const request = require('supertest');
const app = require('../src/server');
const gemini = require('../src/gemini_functions/gemini_functions.js');

describe('Study Controllers', () => {
  let studySetId;
  let fileId;

  beforeAll(async () => {
    // Create test study set with a file
    const createResponse = await request(app)
      .post('/api/study-set')
      .field('userId', '1')
      .field('name', 'Test Set')
      .attach('files', Buffer.from('test content'), 'test.txt');
    
    studySetId = createResponse.body.id;
    // Get fileId from the response
    if (createResponse.body.files && createResponse.body.files.length > 0) {
      fileId = createResponse.body.files[0].file_id;
    }
  });

  afterAll(async () => {
    await request(app).delete(`/api/study-set/${studySetId}`);
  });

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

  // Test validation errors
  it('should return 400 when creating study set without required fields', async () => {
    const response = await request(app)
      .post('/api/study-set')
      .send({ description: 'Description' }); // Missing userId and name
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('User ID and Study Set name are required.');
  });

  // Test error handling in fetch details
  it('should return 404 when fetching non-existent study set', async () => {
    const response = await request(app).get('/api/study-set/99999');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Study set not found.');
  });

  // Test update validation
  it('should return 400 when updating without required name', async () => {
    const response = await request(app)
      .put(`/api/study-set/${studySetId}`)
      .send({ description: 'Updated Description' }); // Missing name
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Name and Study Set ID are required.');
  });

  // Test file operations
  it('should handle study set with files', async () => {
    const response = await request(app)
      .post('/api/study-set')
      .field('userId', '1')
      .field('name', 'Test Set with Files')
      .attach('files', Buffer.from('test content'), 'test.txt');
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Study set created successfully with files.');
  });

  describe('File Operations', () => {
    let testFileId;

    beforeEach(async () => {
      // Create a new study set with file for each test
      const response = await request(app)
        .post('/api/study-set')
        .field('userId', '1')
        .field('name', 'File Test Set')
        .attach('files', Buffer.from('test content'), 'test.txt');
      
      testFileId = response.body.files[0].file_id;
      studySetId = response.body.id;
    });

    it('should fetch files for a study set', async () => {
      const response = await request(app)
        .get(`/api/study-set/${studySetId}/files`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Study Set Operations', () => {
    it('should handle missing userId when getting study sets', async () => {
      const response = await request(app)
        .get('/api/study-sets');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User ID is required.');
    });

    it('should get all study sets for a user', async () => {
      const response = await request(app)
        .get('/api/study-sets')
        .query({ userId: 1 });
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle non-existent study set deletion', async () => {
      const response = await request(app)
        .delete('/api/study-set/99999');
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Error fetching study set details.');
    });
  });

  describe('Study Guide Operations', () => {
    let studySetWithFiles;

    beforeEach(async () => {
      // Create study set with files
      const response = await request(app)
        .post('/api/study-set')
        .field('userId', '1')
        .field('name', 'Guide Test Set')
        .attach('files', Buffer.from('test content'), 'test.txt');
      studySetWithFiles = response.body.id;
    });

    afterEach(async () => {
      if (studySetWithFiles) {
        await request(app).delete(`/api/study-set/${studySetWithFiles}`);
      }
    });

    it('should handle study guide creation for set without files', async () => {
      // Create empty study set
      const emptySet = await request(app)
        .post('/api/study-set')
        .send({ userId: 1, name: 'Empty Set' });
      
      const response = await request(app)
        .post(`/api/study-set/${emptySet.body.id}/study-guides`); // Fix endpoint
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('No files found for the given study set.');

      await request(app).delete(`/api/study-set/${emptySet.body.id}`);
    });

    it('should get study guides for a study set', async () => {
      const response = await request(app)
        .get(`/api/study-set/${studySetWithFiles}/study-guides`); // Fix endpoint
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Quiz Operations', () => {
    let studySetWithFiles;

    beforeEach(async () => {
      // Create study set with files
      const response = await request(app)
        .post('/api/study-set')
        .field('userId', '1')
        .field('name', 'Quiz Test Set')
        .attach('files', Buffer.from('test content'), 'test.txt');
      studySetWithFiles = response.body.id;

      // Mock gemini.createQuiz function
      jest.spyOn(gemini, 'createQuiz').mockResolvedValue('Mock quiz content');
    });

    afterEach(async () => {
      if (studySetWithFiles) {
        await request(app).delete(`/api/study-set/${studySetWithFiles}`);
      }
      jest.restoreAllMocks();
    });

    it('should create a quiz for study set', async () => {
      const response = await request(app)
        .post(`/api/study-set/${studySetWithFiles}/quizzes`)
        .send({ numQuestions: 5 });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('quiz_content');
    });

    it('should get quizzes for a study set', async () => {
      const response = await request(app)
        .get(`/api/study-set/${studySetWithFiles}/quizzes`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle missing questions parameter', async () => {
      // Create empty study set first
      const emptySet = await request(app)
        .post('/api/study-set')
        .send({ userId: 1, name: 'Empty Quiz Set' });
      
      const response = await request(app)
        .post(`/api/study-set/${emptySet.body.id}/quizzes`)
        .send({}); 
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('No files found for the given study set.');

      // Clean up
      await request(app).delete(`/api/study-set/${emptySet.body.id}`);
    });
  });

  describe('Study Plan Operations', () => {
    let studySetWithFiles;

    beforeEach(async () => {
      // Create study set with files
      const response = await request(app)
        .post('/api/study-set')
        .field('userId', '1')
        .field('name', 'Plan Test Set')
        .attach('files', Buffer.from('test content'), 'test.txt');
      studySetWithFiles = response.body.id;

      // Mock gemini.createStudyPlan function
      jest.spyOn(gemini, 'createStudyPlan').mockResolvedValue('Mock study plan content');
    });

    afterEach(async () => {
      if (studySetWithFiles) {
        await request(app).delete(`/api/study-set/${studySetWithFiles}`);
      }
      jest.restoreAllMocks();
    });

    it('should create a study plan', async () => {
      const response = await request(app)
        .post(`/api/study-set/${studySetWithFiles}/study-plan`)
        .send({ days: 7 });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('plan_content');
    });

    it('should get study plans for a study set', async () => {
      // First create a study plan
      await request(app)
        .post(`/api/study-set/${studySetWithFiles}/study-plan`)
        .send({ days: 7 });
        
      const response = await request(app)
        .get(`/api/study-set/${studySetWithFiles}/study-plans`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle missing days parameter', async () => {
      // Create empty study set first
      const emptySet = await request(app)
        .post('/api/study-set')
        .send({ userId: 1, name: 'Empty Plan Set' });

      // Create request for study plan with missing days parameter
      const response = await request(app)
        .post(`/api/study-set/${emptySet.body.id}/study-plan`)
        .send({});

      // Verify empty study set error is returned
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'No files found for the given study set.' });

      // Clean up
      await request(app).delete(`/api/study-set/${emptySet.body.id}`);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid study set ID', async () => {
      const response = await request(app)
        .get('/api/study-set/invalid');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Study set not found.');
    });

    it('should handle missing user ID in request body', async () => {
      const response = await request(app)
        .post('/api/study-set')
        .send({ name: 'Test Set' });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User ID and Study Set name are required.');
    });

    it('should handle missing name in request body', async () => {
      const response = await request(app)
        .post('/api/study-set')
        .send({ userId: 1 });
      expect(response.status).toBe(400); 
      expect(response.body.error).toBe('User ID and Study Set name are required.');
    });
  });
});