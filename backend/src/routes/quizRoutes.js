const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizControllers');

// Route to save a quiz score
/**
 * Handles POST requests to save a quiz score.
 * 
 * 1. Listens for POST requests at the '/scores' endpoint.
 * 2. Calls the saveQuizScore function from the quizController to save the quiz score.
 * 3. Sends a response confirming the score has been saved.
 * 
 * @param {object} req - Express request object containing the quiz score data in the body.
 * @param {object} res - Express response object used to send a success or error response.
 */
router.post('/scores', quizController.saveQuizScore);

// Route to get scores for a specific quiz
/**
 * Handles GET requests to fetch all scores for a specific quiz.
 * 
 * 1. Extracts the quiz ID from the request parameters.
 * 2. Calls the getQuizScores function from the quizController to fetch the scores for the quiz.
 * 3. Sends the list of quiz scores as a response.
 * 
 * @param {object} req - Express request object containing the quiz ID in the URL params.
 * @param {object} res - Express response object used to send the quiz scores or an error response.
 */
router.get('/:quizId/scores', quizController.getQuizScores);

module.exports = router;
