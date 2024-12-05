// controllers/chatController.js
const db = require('../database');

// Controller to fetch messages for a study set
exports.getMessages = (req, res) => {
  const studySetId = req.params.studySetId;

  // Join the study_set_chats table with the users table to get the username
  db.all(`
    SELECT study_set_chats.id, study_set_chats.study_set_id, study_set_chats.user_id, study_set_chats.message, 
           study_set_chats.timestamp, users.username
    FROM study_set_chats
    INNER JOIN users ON study_set_chats.user_id = users.id
    WHERE study_set_chats.study_set_id = ?
    ORDER BY study_set_chats.timestamp ASC
  `, [studySetId], (err, rows) => {
    if (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(rows);  // The rows will now include the username
  });
};

// Controller to post a new message to a study set chat
exports.postMessage = (req, res) => {
  const { studySetId ,userId, message } = req.body;

  // Basic validation
  if (!userId || !message) {
    return res.status(400).json({ error: 'User ID and message are required' });
  }

  const currentTimestamp = new Date().toISOString();

  db.run('INSERT INTO study_set_chats (study_set_id, user_id, message, timestamp) VALUES (?, ?, ?, ?)', [studySetId, userId, message, currentTimestamp], function(err) {
    if (err) {
      console.error('Error posting message:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(201).json({ id: this.lastID, study_set_id: studySetId, user_id: userId, message, timestamp: new Date() });
  });
};
