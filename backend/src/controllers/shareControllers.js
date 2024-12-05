const db = require('../database');

/**
 * Controller to share a study set.
 * 
 * 1. Extracts the studySetId, sharedWithUserId, and sharedByUserId from the request body.
 * 2. Attempts to insert a record into the study_set_shares table.
 * 3. Handles unique constraint errors by checking if the study set has already been shared with the user.
 * 4. Sends a success or error response based on the outcome of the operation.
 * 
 * @param {object} req - Express request object containing studySetId, sharedWithUserId, and sharedByUserId in the body.
 * @param {object} res - Express response object used to send the success/error response.
 */
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

/**
 * Controller to fetch study sets shared with a user.
 * 
 * 1. Extracts the userId from the request parameters.
 * 2. Queries the database to fetch all study sets shared with the user.
 * 3. Sends the study sets or an error response if the query fails.
 * 
 * @param {object} req - Express request object containing the userId in the parameters.
 * @param {object} res - Express response object used to send the study sets or an error response.
 */
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

/**
 * Controller to revoke access to a study set.
 * 
 * 1. Extracts the studySetId and sharedWithUserId from the request body.
 * 2. Executes a DELETE query to remove the share record from the study_set_shares table.
 * 3. Sends a success or error response based on the outcome of the operation.
 * 
 * @param {object} req - Express request object containing studySetId and sharedWithUserId in the body.
 * @param {object} res - Express response object used to send the success/error response.
 */
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

// Export the shareStudySet, getSharedStudySets, and revokeAccess functions for use in routes
module.exports = {
  shareStudySet,
  getSharedStudySets,
  revokeAccess
};
