const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizControllers');

// Save a quiz score
router.post('/scores', quizController.saveQuizScore);

// Get scores for a quiz
router.get('/:quizId/scores', quizController.getQuizScores);

module.exports = router;