// Import required modules
const db = require('../database'); // Database connection module

/**
 * Controller to save a quiz score.
 * 
 * 1. Extracts userId, quizId, and score from the request body.
 * 2. Validates the required fields: userId, quizId, and score.
 * 3. Inserts the quiz score into the database.
 * 4. Sends a success response with the newly created score ID or an error response if an issue occurs.
 * 
 * @param {object} req - Express request object containing userId, quizId, and score in the body.
 * @param {object} res - Express response object used to send the success/error response.
 */
const saveQuizScore = (req, res) => { 
  console.log(req.body)
  const { userId, quizId, score } = req.body; // Extracting the required fields from the request body

  // Validate if the required fields are provided in the request
  if (!userId || !quizId || typeof score === 'undefined') {
    return res.status(400).json({ error: 'Missing required fields: userId, quizId, score' });
  }

  const query = `
    INSERT INTO quiz_scores (user_id, quiz_id, score)
    VALUES (?, ?, ?)
  `; // SQL query to insert the quiz score into the database

  db.run(query, [userId, quizId, score], function (err) {
    if (err) {
      console.error('Error saving quiz score:', err); // Log error if insertion fails
      return res.status(500).json({ error: 'Failed to save quiz score' });
    }

    // Send a success response with the ID of the newly created quiz score
    res.status(201).json({
      message: 'Quiz score saved successfully',
      scoreId: this.lastID, // Return the ID of the newly created score
    });
  });
};

/**
 * Controller to retrieve scores for a specific quiz.
 * 
 * 1. Extracts the quizId from the request parameters.
 * 2. Queries the database for all quiz scores related to the specified quizId.
 * 3. Sends a success response with the quiz scores or an error response if an issue occurs.
 * 
 * @param {object} req - Express request object containing quizId in the parameters.
 * @param {object} res - Express response object used to send the scores or an error response.
 */
const getQuizScores = (req, res) => {
  const { quizId } = req.params; // Extracting quizId from request parameters

  const query = `
    SELECT 
      qs.id AS scoreId,
      u.username,
      qs.score,
      qs.taken_date
    FROM 
      quiz_scores qs
    JOIN 
      users u ON qs.user_id = u.id
    WHERE 
      qs.quiz_id = ?
    ORDER BY 
      qs.score DESC, qs.taken_date ASC
  `; // SQL query to get quiz scores sorted by score (descending) and taken date (ascending)

  db.all(query, [quizId], (err, rows) => {
    if (err) {
      console.error('Error retrieving quiz scores:', err); // Log error if query fails
      return res.status(500).json({ error: 'Failed to retrieve quiz scores' });
    }

    // Send a success response with the quiz scores
    res.status(200).json({
      message: 'Quiz scores retrieved successfully',
      scores: rows, // Return the retrieved quiz scores
    });
  });
};

// Export the saveQuizScore and getQuizScores functions for use in routes
module.exports = {
  saveQuizScore,
  getQuizScores
};
