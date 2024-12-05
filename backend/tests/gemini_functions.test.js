const path = require('path');
const { createStudyGuide, createQuiz, createStudyPlan } = require('../src/gemini_functions/gemini_functions');

describe('Gemini Functions', () => {
  it('should create a study guide', async () => {
    const filePaths = [
      path.resolve(__dirname, 'testfile.pdf'),
      path.resolve(__dirname, 'testfile.pdf')
    ];
    const result = await createStudyGuide(filePaths);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  }, 20000); // Increase timeout to 20 seconds

  it('should create a quiz', async () => {
    const filePaths = [
      path.resolve(__dirname, 'testfile.pdf'),
      path.resolve(__dirname, 'testfile.pdf')
    ];
    const result = await createQuiz(filePaths, 5);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  }, 20000); // Increase timeout to 20 seconds

  it('should create a study plan', async () => {
    const filePaths = [
      path.resolve(__dirname, 'testfile.pdf'),
      path.resolve(__dirname, 'testfile.pdf')
    ];
    const result = await createStudyPlan(filePaths, 7);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  }, 20000); // Increase timeout to 20 seconds
});