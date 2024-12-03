// controllers/studyControllers.js
const db = require('../database');
const path = require('path');
const fs = require('fs');
const gemini = require('../gemini_functions/gemini_functions.js'); // Import gemini functions

// Helper function for starting a transaction
const startTransaction = () => {
  db.run('BEGIN TRANSACTION');
};

// Helper function for committing a transaction
const commitTransaction = () => {
  db.run('COMMIT');
};

// Helper function for rolling back a transaction
const rollbackTransaction = () => {
  db.run('ROLLBACK');
};

// Helper function to create the upload directory if it doesn't exist
const createUploadDirectory = (userId, studySetId) => {
  const uploadDir = path.join('./uploads', userId.toString(), studySetId.toString());
  fs.mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
};

// Helper function to move files to the final directory
const moveFileToFinalDirectory = (file, uploadDir) => {
  return new Promise((resolve, reject) => {
    const finalFilePath = path.join(uploadDir, file.filename);
    fs.rename(file.path, finalFilePath, (err) => {
      if (err) {
        reject(new Error('Error moving file: ' + err));
      } else {
        resolve(finalFilePath);
      }
    });
  });
};

// Helper function to insert file path into the database
const insertFilePathToDb = (studySetId, filePath) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO study_set_files (study_set_id, file_path) VALUES (?, ?)',
      [studySetId, filePath],
      function (err) {
        if (err) {
          reject(new Error('Error inserting file into database: ' + err));
        } else {
          resolve();
        }
      }
    );
  });
};

// Controller to create a new study set
const createStudySet = (req, res) => {
  const { userId, name, description } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ error: 'User ID and Study Set name are required.' });
  }

  const currentTimestamp = new Date().toISOString();

  startTransaction();

  db.run(
    'INSERT INTO study_sets (user_id, name, description, creation_date, modification_date) VALUES (?, ?, ?, ?, ?)',
    [userId, name, description || null, currentTimestamp, currentTimestamp],
    function (err) {
      if (err) {
        rollbackTransaction();
        console.error('Error creating study set:', err);
        return res.status(500).json({ error: 'Error creating study set.' });
      }

      const studySetId = this.lastID;
      const uploadDir = createUploadDirectory(userId, studySetId);

      if (!req.files || req.files.length === 0) {
        commitTransaction();
        return res.status(201).json({
          message: 'Study set created successfully without files.',
          id: studySetId,
          name,
          description,
          files: []
        });
      }

      const filePromises = req.files.map((file) => {
        return moveFileToFinalDirectory(file, uploadDir)
          .then((finalFilePath) => insertFilePathToDb(studySetId, finalFilePath))
          .catch((err) => {
            console.error(err);
            throw err;
          });
      });

      Promise.all(filePromises)
        .then(() => {
          commitTransaction();
          res.status(201).json({
            message: 'Study set created successfully with files.',
            id: studySetId,
            name,
            description,
            files: req.files.map((file) => ({
              originalName: file.originalname,
              finalPath: path.join(uploadDir, file.filename)
            }))
          });
        })
        .catch((error) => {
          rollbackTransaction();
          console.error('File upload error:', error);
          res.status(500).json({ error: 'Error uploading files.' });
        });
    }
  );
};

// Controller to get all study sets for a user
const getAllStudySets = (req, res) => {
  const { userId } = req.query;

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

// Controller to get files for a specific study set
const getFilesForStudySet = (req, res) => {
  const { id: studySetId } = req.params;

  db.all('SELECT * FROM study_set_files WHERE study_set_id = ?', [studySetId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching files.' });
    }
    res.json(rows);
  });
};

// Controller to get details of a specific study set
const getStudySetDetails = (req, res) => {
  const { id: studySetId } = req.params;

  db.get('SELECT * FROM study_sets WHERE id = ?', [studySetId], (err, studySet) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching study set details.' });
    }
    if (!studySet) {
      return res.status(404).json({ error: 'Study set not found.' });
    }

    db.all('SELECT * FROM study_set_files WHERE study_set_id = ?', [studySetId], (err, files) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching study set files.' });
      }

      res.json({
        study_set_id: studySet.id,
        user_id: studySet.user_id,
        name: studySet.name,
        description: studySet.description,
        creation_date: studySet.creation_date,
        modification_date: studySet.modification_date,
        files: files.map((file) => ({
          file_id: file.id,
          file_path: file.file_path
        }))
      });
    });
  });
};

// Controller to update a study set
const updateStudySet = (req, res) => {
  const { name, description } = req.body;
  const { id: studySetId } = req.params;

  if (!name || !studySetId) {
    return res.status(400).json({ error: 'Name and Study Set ID are required.' });
  }

  const currentTimestamp = new Date().toISOString();

  startTransaction();

  db.run(
    'UPDATE study_sets SET name = ?, description = ?, modification_date = ? WHERE id = ?',
    [name, description || null, currentTimestamp, studySetId],
    function (err) {
      if (err) {
        rollbackTransaction();
        console.error('Error updating study set:', err);
        return res.status(500).json({ error: 'Error updating study set.' });
      }

      if (!req.files || req.files.length === 0) {
        commitTransaction();
        return res.status(200).json({ message: 'Study set updated successfully without files.' });
      }

      db.get('SELECT user_id FROM study_sets WHERE id = ?', [studySetId], (err, row) => {
        if (err || !row) {
          rollbackTransaction();
          console.error('Error fetching user ID:', err || 'Study set not found');
          return res.status(500).json({ error: 'Error fetching study set details.' });
        }

        const uploadDir = createUploadDirectory(row.user_id, studySetId);

        const filePromises = req.files.map((file) => {
          return moveFileToFinalDirectory(file, uploadDir)
            .then((finalFilePath) => insertFilePathToDb(studySetId, finalFilePath))
            .catch((err) => {
              console.error(err);
              throw err;
            });
        });

        Promise.all(filePromises)
          .then(() => {
            commitTransaction();
            res.status(200).json({ message: 'Study set updated successfully with files.' });
          })
          .catch((error) => {
            rollbackTransaction();
            console.error('File upload error:', error);
            res.status(500).json({ error: 'Error uploading files.' });
          });
      });
    }
  );
};

// Controller to delete a study set
const deleteStudySet = (req, res) => {
  const { id: studySetId } = req.params;

  startTransaction();

  db.get('SELECT user_id FROM study_sets WHERE id = ?', [studySetId], (err, row) => {
    if (err || !row) {
      rollbackTransaction();
      console.error('Error fetching user ID:', err || 'Study set not found.');
      return res.status(500).json({ error: 'Error fetching study set details.' });
    }

    const studySetDir = path.join('./uploads', row.user_id.toString(), studySetId.toString());

    db.run('DELETE FROM study_set_files WHERE study_set_id = ?', [studySetId], function (err) {
      if (err) {
        rollbackTransaction();
        console.error('Error deleting files:', err);
        return res.status(500).json({ error: 'Error deleting files.' });
      }

      db.run('DELETE FROM study_sets WHERE id = ?', [studySetId], function (err) {
        if (err) {
          rollbackTransaction();
          console.error('Error deleting study set:', err);
          return res.status(500).json({ error: 'Error deleting study set.' });
        }

        fs.rmSync(studySetDir, { recursive: true, force: true });

        commitTransaction();
        res.status(200).json({ message: 'Study set deleted successfully.' });
      });
    });
  });
};

// Helper function to delete a file from the filesystem
const deleteFileFromFolder = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(new Error('Error deleting file from folder: ' + err));
      } else {
        resolve();
      }
    });
  });
};

// Helper function to delete file entry from the database
const deleteFileFromDb = (fileId) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM study_set_files WHERE id = ?', [fileId], function (err) {
      if (err) {
        reject(new Error('Error deleting file from database: ' + err));
      } else {
        resolve();
      }
    });
  });
};

// Helper function to delete a file from both the database and the folder
const deleteFileFromDbAndFolder = (fileId, filePath) => {
  return deleteFileFromDb(fileId)
    .then(() => deleteFileFromFolder(filePath))
    .catch((err) => {
      throw err;
    });
};

// Controller to delete a specific file from a study set
const deleteFileFromStudySet = (req, res) => {
  const { fileId } = req.params;

  if (!fileId) {
    return res.status(400).json({ error: 'File ID is required.' });
  }

  // Get the file path from the database
  db.get('SELECT file_path FROM study_set_files WHERE id = ?', [fileId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching file path from database.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'File not found.' });
    }

    // Use the helper function to delete the file
    deleteFileFromDbAndFolder(fileId, row.file_path)
      .then(() => {
        res.status(200).json({ message: 'File deleted successfully.' });
      })
      .catch((error) => {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Error deleting file.' });
      });
  });
};

// Controller to fetch study guides for a specific study set
const getStudyGuidesForStudySet = (req, res) => {
  const { id: studySetId } = req.params;

  db.all('SELECT * FROM study_guides WHERE study_set_id = ?', [studySetId], (err, rows) => {
    if (err) {
      console.error('Error fetching study guides:', err);
      return res.status(500).json({ error: 'Error fetching study guides.' });
    }
    res.json(rows);
  });
};

// Controller to create a new study guide
const createStudyGuide = (req, res) => {
  const { id: studySetId } = req.params;

  // Step 1: Fetch all files for the given study set from the database
  db.all('SELECT file_path FROM study_set_files WHERE study_set_id = ?', [studySetId], (err, rows) => {
    if (err) {
      console.error('Error fetching files:', err);
      return res.status(500).json({ error: 'Error fetching files.' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No files found for the given study set.' });
    }

    // Step 2: Extract the file paths from the result
    const filePaths = rows.map(row => row.file_path);

    console.log(filePaths)

    // Step 3: Pass the file paths to the gemini.createStudyGuide function
    gemini.createStudyGuide(filePaths)
      .then(guideContent => {
        // Step 4: Use the result as the guide_content
        db.run(
          'INSERT INTO study_guides (study_set_id, guide_content) VALUES (?, ?)',
          [studySetId, guideContent],
          function (err) {
            if (err) {
              console.error('Error saving study guide:', err);
              return res.status(500).json({ error: 'Error saving study guide.' });
            }

            res.status(201).json({
              message: 'Study guide created successfully.',
              study_set_id: studySetId,
              guide_content: guideContent
            });
          }
        );
      })
      .catch((error) => {
        console.error('Error creating study guide:', error);
        res.status(500).json({ error: 'Error creating study guide.' });
      });
  });
};

// Controller to delete a study guide
const deleteStudyGuide = (req, res) => {
  const { id: studySetId, guideId } = req.params;

  db.run(
    'DELETE FROM study_guides WHERE id = ? AND study_set_id = ?',
    [guideId, studySetId],
    function (err) {
      if (err) {
        console.error('Error deleting study guide:', err);
        return res.status(500).json({ error: 'Error deleting study guide.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Study guide not found.' });
      }
      res.json({ message: 'Study guide deleted successfully.' });
    }
  );
};

// Controller to get all quizzes for a specific study set
const getQuizzesForStudySet = (req, res) => {
  const { id: studySetId } = req.params;

  db.all('SELECT * FROM quizzes WHERE study_set_id = ?', [studySetId], (err, rows) => {
    if (err) {
      console.error('Error fetching study guides:', err);
      return res.status(500).json({ error: 'Error fetching study guides.' });
    }
    res.json(rows);
  });
};

// Controller to get all quizzes for a specific study set
const getQuizForStudySet = (req, res) => {
  const { id: quizId } = req.params;

  db.all('SELECT quiz_content FROM quizzes WHERE id = ?', [quizId], (err, rows) => {
    if (err) {
      console.error('Error fetching study guides:', err);
      return res.status(500).json({ error: 'Error fetching study guides.' });
    }
    res.json(rows);
  });
};

// Controller to create a new quiz
const createQuiz = (req, res) => {
  const { id: studySetId } = req.params;

  // Step 1: Fetch all files for the given study set from the database
  db.all('SELECT file_path FROM study_set_files WHERE study_set_id = ?', [studySetId], (err, rows) => {
    if (err) {
      console.error('Error fetching files:', err);
      return res.status(500).json({ error: 'Error fetching files.' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No files found for the given study set.' });
    }

    // Step 2: Extract the file paths from the result
    const filePaths = rows.map(row => row.file_path);

    // Step 3: Pass the file paths to the gemini.createStudyGuide function
    gemini.createQuiz(filePaths, 2)
      .then(guideContent => {
        // Step 4: Use the result as the guide_content
        db.run(
          'INSERT INTO quizzes (study_set_id, quiz_content) VALUES (?, ?)',
          [studySetId, guideContent],
          function (err) {
            if (err) {
              console.error('Error saving quiz:', err);
              return res.status(500).json({ error: 'Error saving quiz.' });
            }

            res.status(201).json({
              message: 'Quiz created successfully.',
              study_set_id: studySetId,
              guide_content: guideContent
            });
          }
        );
      })
      .catch((error) => {
        console.error('Error creating quiz:', error);
        res.status(500).json({ error: 'Error creating quiz.' });
      });
  });
};

// Controller to delete a quiz for a specific study set
const deleteQuiz = (req, res) => {
  const { id: studySetId, quizId } = req.params;

  db.run('DELETE FROM quizzes WHERE id = ? AND study_set_id = ?', 
    [quizId, studySetId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Error deleting quiz.' });
    }
    res.status(200).json({ message: 'Quiz deleted successfully.' });
  });
};

module.exports = {
  createStudySet,
  getAllStudySets,
  getStudySetDetails,
  getFilesForStudySet,
  updateStudySet,
  deleteStudySet,
  deleteFileFromStudySet,
  getStudyGuidesForStudySet,
  createStudyGuide,
  deleteStudyGuide,
  getQuizzesForStudySet,
  getQuizForStudySet,
  createQuiz,
  deleteQuiz,
};
