// controllers/studyControllers.js
const db = require('../database');
const path = require('path');
const fs = require('fs');

const createStudySet = (req, res) => {
  const { userId, name, description } = req.body;

  // Input validation
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  if (!name) {
    return res.status(400).json({ error: 'Study set name is required.' });
  }

  // Get the current timestamp
  const currentTimestamp = new Date().toISOString();

  // Start a database transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION'); // Begin transaction

    // Insert into the study_sets table with creation_date and modification_date
    db.run(
      'INSERT INTO study_sets (user_id, name, description, creation_date, modification_date) VALUES (?, ?, ?, ?, ?)',
      [userId, name, description || null, currentTimestamp, currentTimestamp],
      function (err) {
        if (err) {
          db.run('ROLLBACK'); // Rollback if insert fails
          console.error('Error creating study set:', err);
          return res.status(500).json({ error: 'Error creating study set.' });
        }

        const studySetId = this.lastID; // Get the inserted study set's ID

        // Define the final upload directory
        const finalUploadDir = `./uploads/${userId}/${studySetId}`;
        fs.mkdirSync(finalUploadDir, { recursive: true }); // Ensure the directory exists

        // If no files are uploaded, commit the transaction and respond
        if (!req.files || req.files.length === 0) {
          db.run('COMMIT'); // Commit the transaction
          return res.status(201).json({
            message: 'Study set created successfully without files.',
            id: studySetId,
            name: name,
            description: description,
            files: []
          });
        }

        // Process file uploads: move files to final directory and insert paths into database
        const filePromises = req.files.map((file) => {
          return new Promise((resolve, reject) => {
            const finalFilePath = path.join(finalUploadDir, file.filename);

            // Move the file to the final directory
            fs.rename(file.path, finalFilePath, (err) => {
              if (err) {
                console.error('Error moving file:', err);
                reject(err);
              } else {
                // Insert file path into study_set_files table
                db.run(
                  'INSERT INTO study_set_files (study_set_id, file_path) VALUES (?, ?)',
                  [studySetId, finalFilePath],
                  function (err) {
                    if (err) {
                      console.error('Error inserting file into database:', err);
                      reject(err);
                    } else {
                      resolve();
                    }
                  }
                );
              }
            });
          });
        });

        // Wait for all file operations to complete
        Promise.all(filePromises)
          .then(() => {
            db.run('COMMIT'); // Commit the transaction after successful file uploads
            res.status(201).json({
              message: 'Study set created successfully with files.',
              id: studySetId,
              name: name,
              description: description,
              files: req.files.map(file => ({
                originalName: file.originalname,
                finalPath: path.join(finalUploadDir, file.filename)
              }))
            });
          })
          .catch((error) => {
            db.run('ROLLBACK'); // Rollback if an error occurred during file upload
            console.error('File upload error:', error);
            res.status(500).json({ error: 'Error uploading files.' });
          });
      }
    );
  });
};

// Route to get all study sets
const getAllStudySets = (req, res) => {
  const userId = req.query.userId; // Get userId from query parameters

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const query = 'SELECT * FROM study_sets WHERE user_id = ?';
  db.all(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching study sets.' });
    }
    res.json(rows);
  });
};

// Route to get files for a specific study set
const getFilesForStudySet = (req, res) => {
  const studySetId = req.params.id;
  db.all('SELECT * FROM study_set_files WHERE study_set_id = ?', [studySetId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching files.' });
    }
    res.json(rows);
  });
};

// Route to get specific study set details
const getStudySetDetails = (req, res) => {
  const studySetId = req.params.id;

  // Query to get study set details based on the study_set_id
  const studySetQuery = 'SELECT * FROM study_sets WHERE id = ?';

  db.get(studySetQuery, [studySetId], (err, studySet) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching study set details.' });
    }

    // If study set is not found
    if (!studySet) {
      return res.status(404).json({ error: 'Study set not found.' });
    }

    // Query to get files associated with the study set
    const filesQuery = 'SELECT * FROM study_set_files WHERE study_set_id = ?';
    db.all(filesQuery, [studySetId], (err, files) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching study set files.' });
      }

      // Construct the response
      const response = {
        study_set_id: studySet.id,
        user_id: studySet.user_id,
        name: studySet.name,
        description: studySet.description,
        creation_date: studySet.creation_date,
        modification_date: studySet.modification_date,
        files: files.map(file => ({
          file_id: file.id,
          file_path: file.file_path
        }))
      };

      // Send the response
      res.json(response);
    });
  });
};

const updateStudySet = (req, res) => {
  const { name, description } = req.body;
  const studySetId = req.params.id;

  // Input validation
  if (!name || !studySetId) {
    return res.status(400).json({ error: 'Name and Study Set ID are required.' });
  }

  // Get the current timestamp for the modification date
  const currentTimestamp = new Date().toISOString();

  db.serialize(() => {
    db.run('BEGIN TRANSACTION'); // Begin transaction

    // Update the study set in the database
    db.run(
      'UPDATE study_sets SET name = ?, description = ?, modification_date = ? WHERE id = ?',
      [name, description || null, currentTimestamp, studySetId],
      function (err) {
        if (err) {
          db.run('ROLLBACK'); // Rollback if update fails
          console.error('Error updating study set:', err);
          return res.status(500).json({ error: 'Error updating study set.' });
        }

        // If no files are uploaded, commit transaction and respond
        if (!req.files || req.files.length === 0) {
          db.run('COMMIT'); // Commit transaction
          return res.status(200).json({ message: 'Study set updated successfully without files.' });
        }

        // Fetch the userId associated with the study set to organize file storage
        db.get('SELECT user_id FROM study_sets WHERE id = ?', [studySetId], (err, row) => {
          if (err || !row) {
            db.run('ROLLBACK'); // Rollback if fetching user_id fails
            console.error('Error fetching user ID:', err || 'Study set not found');
            return res.status(500).json({ error: 'Error fetching study set details.' });
          }

          const userId = row.user_id;
          const finalUploadDir = `./uploads/${userId}/${studySetId}`;

          // Ensure the directory exists
          fs.mkdirSync(finalUploadDir, { recursive: true });

          // Process file uploads: move files to the final directory and insert paths into the database
          const filePromises = req.files.map((file) => {
            return new Promise((resolve, reject) => {
              const finalFilePath = path.join(finalUploadDir, file.filename);

              // Move the file to the final directory
              fs.rename(file.path, finalFilePath, (err) => {
                if (err) {
                  console.error('Error moving file:', err);
                  reject(err);
                } else {
                  // Insert file path into the study_set_files table
                  db.run(
                    'INSERT INTO study_set_files (study_set_id, file_path) VALUES (?, ?)',
                    [studySetId, finalFilePath],
                    function (err) {
                      if (err) {
                        console.error('Error inserting file into database:', err);
                        reject(err);
                      } else {
                        resolve();
                      }
                    }
                  );
                }
              });
            });
          });

          // Wait for all file operations to complete
          Promise.all(filePromises)
            .then(() => {
              db.run('COMMIT'); // Commit the transaction after successful file uploads
              res.status(200).json({ message: 'Study set updated successfully with files.' });
            })
            .catch((error) => {
              db.run('ROLLBACK'); // Rollback if an error occurred during file upload
              console.error('File upload error:', error);
              res.status(500).json({ error: 'Error uploading files.' });
            });
        });
      }
    );
  });
};

const deleteStudySet = (req, res) => {
  const studySetId = req.params.id;

  // Start a database transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION'); // Begin transaction

    // Fetch the userId associated with the study set
    db.get('SELECT user_id FROM study_sets WHERE id = ?', [studySetId], (err, row) => {
      if (err || !row) {
        db.run('ROLLBACK'); // Rollback if userId fetching fails
        console.error('Error fetching user ID:', err || 'Study set not found.');
        return res.status(500).json({ error: 'Error fetching study set details.' });
      }

      const userId = row.user_id;
      const studySetDir = path.join('./uploads', userId.toString(), studySetId.toString());

      // Delete the associated files from the study_set_files table
      db.run(
        'DELETE FROM study_set_files WHERE study_set_id = ?',
        [studySetId],
        function (err) {
          if (err) {
            db.run('ROLLBACK'); // Rollback if file deletion fails
            console.error('Error deleting files:', err);
            return res.status(500).json({ error: 'Error deleting files.' });
          }

          // Delete the study set itself from the study_sets table
          db.run(
            'DELETE FROM study_sets WHERE id = ?',
            [studySetId],
            function (err) {
              if (err) {
                db.run('ROLLBACK'); // Rollback if study set deletion fails
                console.error('Error deleting study set:', err);
                return res.status(500).json({ error: 'Error deleting study set.' });
              }

              // Delete the study set directory
              fs.rm(studySetDir, { recursive: true, force: true }, (err) => {
                if (err) {
                  db.run('ROLLBACK'); // Rollback if directory deletion fails
                  console.error('Error deleting study set directory:', err);
                  return res.status(500).json({ error: 'Error deleting study set directory.' });
                }

                // Commit the transaction after successful deletion
                db.run('COMMIT');
                res.status(200).json({ message: 'Study set and associated directory deleted successfully.' });
              });
            }
          );
        }
      );
    });
  });
};

module.exports = {
  createStudySet,
  getAllStudySets,
  getFilesForStudySet,
  getStudySetDetails,
  updateStudySet,
  deleteStudySet
};
