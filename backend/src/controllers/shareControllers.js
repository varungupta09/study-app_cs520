const db = require('../database');

// Share a study set
const shareStudySet = (req, res) => {
  const { studySetId, sharedWithUserId, sharedByUserId } = req.body;

  const query = `
    INSERT INTO study_set_shares (study_set_id, shared_with_user_id, shared_by_user_id)
    VALUES (?, ?, ?)
  `;

  db.run(query, [studySetId, sharedWithUserId, sharedByUserId], (err) => {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'Study set already shared with this user.' });
      } else {
        res.status(500).json({ error: 'Error sharing study set.' });
      }
    } else {
      res.status(200).json({ message: 'Study set shared successfully.' });
    }
  });
};

// Fetch study sets shared with the user
const getSharedStudySets = (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT ss.id, ss.name, ss.description, ss.creation_date, u.username AS shared_by
    FROM study_set_shares sss
    JOIN study_sets ss ON sss.study_set_id = ss.id
    JOIN users u ON sss.shared_by_user_id = u.id
    WHERE sss.shared_with_user_id = ?
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching shared study sets.' });
    } else {
      res.status(200).json(rows);
    }
  });
};

// Revoke access to a study set
const revokeAccess = (req, res) => {
  const { studySetId, sharedWithUserId } = req.body;

  const query = `
    DELETE FROM study_set_shares
    WHERE study_set_id = ? AND shared_with_user_id = ?
  `;

  db.run(query, [studySetId, sharedWithUserId], (err) => {
    if (err) {
      res.status(500).json({ error: 'Error revoking share.' });
    } else {
      res.status(200).json({ message: 'Access revoked successfully.' });
    }
  });
};

module.exports = {
  shareStudySet,
  getSharedStudySets,
  revokeAccess
};