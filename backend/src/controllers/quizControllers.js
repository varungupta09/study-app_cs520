const db = require('../database');

// Save a quiz score
exports.saveQuizScore = (req, res) => {
  const { userId, quizId, score } = req.body;

  if (!userId || !quizId || typeof score === 'undefined') {
    return res.status(400).json({ error: 'Missing required fields: userId, quizId, score' });
  }

  const query = `
    INSERT INTO quiz_scores (user_id, quiz_id, score)
    VALUES (?, ?, ?)
  `;

  db.run(query, [userId, quizId, score], function (err) {
    if (err) {
      console.error('Error saving quiz score:', err);
      return res.status(500).json({ error: 'Failed to save quiz score' });
    }

    res.status(201).json({
      message: 'Quiz score saved successfully',
      scoreId: this.lastID,
    });
  });
};

// Get scores for a quiz
const getQuizScores = (req, res) => {
  const { quizId } = req.params;

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
  `;

  db.all(query, [quizId], (err, rows) => {
    if (err) {
      console.error('Error retrieving quiz scores:', err);
      return res.status(500).json({ error: 'Failed to retrieve quiz scores' });
    }

    res.status(200).json({
      message: 'Quiz scores retrieved successfully',
      scores: rows,
    });
  });
};

module.exports = {
  saveQuizScore,
  getQuizScores
};

