// controllers/studyControllers.js
const db = require('../database');
const path = require('path');
const fs = require('fs');
const gemini = require('../gemini_functions/gemini_functions.js'); // Import gemini functions

// Helper function for starting a transaction
/**
 * Starts a database transaction by executing the BEGIN TRANSACTION command.
 */
const startTransaction = () => {
  db.run('BEGIN TRANSACTION');
};

// Helper function for committing a transaction
/**
 * Commits the current database transaction by executing the COMMIT command.
 */
const commitTransaction = () => {
  db.run('COMMIT');
};

// Helper function for rolling back a transaction
/**
 * Rolls back the current database transaction by executing the ROLLBACK command.
 */
const rollbackTransaction = () => {
  db.run('ROLLBACK');
};

// Helper function to create the upload directory if it doesn't exist
/**
 * Creates an upload directory for the study set if it doesn't already exist.
 * The directory is named using the userId and studySetId.
 * 
 * @param {number} userId - The ID of the user creating the study set.
 * @param {number} studySetId - The ID of the study set.
 * @returns {string} - The path to the upload directory.
 */
const createUploadDirectory = (userId, studySetId) => {
  const uploadDir = path.join('./uploads', userId.toString(), studySetId.toString());
  fs.mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
};

// Helper function to move files to the final directory
/**
 * Moves a file from its temporary location to the final upload directory.
 * 
 * @param {object} file - The file object from the request.
 * @param {string} uploadDir - The path to the upload directory.
 * @returns {Promise} - Resolves to the final file path on success, or rejects with an error message on failure.
 */
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
/**
 * Inserts the file path of a study set file into the database.
 * 
 * @param {number} studySetId - The ID of the study set.
 * @param {string} filePath - The path of the uploaded file.
 * @returns {Promise} - Resolves when the file path is successfully inserted into the database.
 */
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
/**
 * Controller function to create a new study set.
 * 
 * 1. Extracts userId, name, and description from the request body.
 * 2. Starts a database transaction to ensure atomicity.
 * 3. Creates a new study set record in the database.
 * 4. If files are uploaded, it moves them to the final directory and inserts their paths into the database.
 * 5. If successful, sends a success response; if any errors occur, rolls back the transaction and sends an error response.
 * 
 * @param {object} req - Express request object containing userId, name, description, and possibly files.
 * @param {object} res - Express response object used to send the success/error response.
 */
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
/**
 * Controller function to retrieve all study sets associated with a given user.
 * 
 * 1. Extracts the userId from the request query parameters.
 * 2. Queries the database for study sets that belong to the user.
 * 3. Sends the study sets in the response or an error message if the query fails.
 * 
 * @param {object} req - Express request object containing userId as a query parameter.
 * @param {object} res - Express response object used to send the study sets or an error response.
 */
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
/**
 * Controller function to retrieve all files associated with a study set.
 * 
 * 1. Extracts the study set ID from the request parameters.
 * 2. Queries the database to fetch all files associated with the study set.
 * 3. Sends the list of files in the response or an error message if the query fails.
 * 
 * @param {object} req - Express request object containing the study set ID in the URL parameters.
 * @param {object} res - Express response object used to send the list of files or an error response.
 */
const getFilesForStudySet = (req, res) => {
  const { id: studySetId } = req.params; // Extract study set ID from request parameters

  // Query the database to get all files associated with the study set
  db.all('SELECT * FROM study_set_files WHERE study_set_id = ?', [studySetId], (err, rows) => {
    // Handle error if query fails
    if (err) {
      return res.status(500).json({ error: 'Error fetching files.' });
    }
    res.json(rows); // Return the list of files
  });
};

// Controller to get details of a specific study set
/**
 * Controller function to retrieve details of a specific study set.
 * 
 * 1. Extracts the study set ID from the request parameters.
 * 2. Queries the database to fetch the study set details.
 * 3. If files exist for the study set, it fetches those too and includes them in the response.
 * 4. Sends the study set details along with associated files, or an error if any issue occurs.
 * 
 * @param {object} req - Express request object containing the study set ID in the URL parameters.
 * @param {object} res - Express response object used to send the study set details or an error response.
 */
const getStudySetDetails = (req, res) => {
  const { id: studySetId } = req.params; // Extract study set ID from request parameters

  // Query the database to fetch the study set details
  db.get('SELECT * FROM study_sets WHERE id = ?', [studySetId], (err, studySet) => {
    // Handle error if query fails
    if (err) {
      return res.status(500).json({ error: 'Error fetching study set details.' });
    }
    // Handle case where no study set is found
    if (!studySet) {
      return res.status(404).json({ error: 'Study set not found.' });
    }

    // Query the database to fetch files associated with the study set
    db.all('SELECT * FROM study_set_files WHERE study_set_id = ?', [studySetId], (err, files) => {
      // Handle error if file query fails
      if (err) {
        return res.status(500).json({ error: 'Error fetching study set files.' });
      }

      // Return the study set details along with associated files
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
/**
 * Controller function to update an existing study set.
 * 
 * 1. Extracts the study set ID, name, and description from the request parameters and body.
 * 2. Starts a database transaction to ensure atomicity.
 * 3. Updates the study set record in the database.
 * 4. If new files are uploaded, moves them to the final directory and updates the database with their paths.
 * 5. Commits the transaction if successful, or rolls it back if any errors occur.
 * 
 * @param {object} req - Express request object containing the study set details in the body.
 * @param {object} res - Express response object used to send a success/error response.
 */
const updateStudySet = (req, res) => {
  const { name, description } = req.body; // Extract name and description from request body
  const { id: studySetId } = req.params; // Extract study set ID from request parameters

  // Handle missing name or study set ID
  if (!name || !studySetId) {
    return res.status(400).json({ error: 'Name and Study Set ID are required.' });
  }

  const currentTimestamp = new Date().toISOString(); // Get current timestamp for modification date

  startTransaction(); // Start a database transaction

  // Update study set details in the database
  db.run(
    'UPDATE study_sets SET name = ?, description = ?, modification_date = ? WHERE id = ?',
    [name, description || null, currentTimestamp, studySetId],
    function (err) {
      // Handle any errors during the update
      if (err) {
        rollbackTransaction();
        console.error('Error updating study set:', err);
        return res.status(500).json({ error: 'Error updating study set.' });
      }

      // If no files are uploaded, commit transaction and return success response
      if (!req.files || req.files.length === 0) {
        commitTransaction();
        return res.status(200).json({ message: 'Study set updated successfully without files.' });
      }

      // Query the database to get user ID for directory creation
      db.get('SELECT user_id FROM study_sets WHERE id = ?', [studySetId], (err, row) => {
        // Handle any errors or missing study set
        if (err || !row) {
          rollbackTransaction();
          console.error('Error fetching user ID:', err || 'Study set not found');
          return res.status(500).json({ error: 'Error fetching study set details.' });
        }

        // Create an upload directory for the files
        const uploadDir = createUploadDirectory(row.user_id, studySetId);

        // Process the uploaded files
        const filePromises = req.files.map((file) => {
          return moveFileToFinalDirectory(file, uploadDir) // Move each file to final directory
            .then((finalFilePath) => insertFilePathToDb(studySetId, finalFilePath)) // Insert file path into DB
            .catch((err) => {
              console.error(err);
              throw err;
            });
        });

        // Wait for all files to be processed, then commit transaction
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
/**
 * Controller function to delete a study set.
 * 
 * 1. Extracts the study set ID from the request parameters.
 * 2. Starts a database transaction to ensure atomicity.
 * 3. Queries the database to fetch the user_id associated with the study set.
 * 4. Deletes all files associated with the study set from the database and filesystem.
 * 5. Deletes the study set record from the database.
 * 6. Removes the study set directory from the filesystem.
 * 7. If successful, sends a success response; if any errors occur, rolls back the transaction and sends an error response.
 * 
 * @param {object} req - Express request object containing the study set ID in the URL params.
 * @param {object} res - Express response object used to send the success/error response.
 */
const deleteStudySet = (req, res) => {
  const { id: studySetId } = req.params;

  // Start a database transaction
  startTransaction();

  // Fetch the user_id for the study set to verify ownership and locate files
  db.get('SELECT user_id FROM study_sets WHERE id = ?', [studySetId], (err, row) => {
    if (err || !row) {
      rollbackTransaction();
      console.error('Error fetching user ID:', err || 'Study set not found.');
      return res.status(500).json({ error: 'Error fetching study set details.' });
    }

    // Path to the study set directory on the filesystem
    const studySetDir = path.join('./uploads', row.user_id.toString(), studySetId.toString());

    // Delete all study set files from the database
    db.run('DELETE FROM study_set_files WHERE study_set_id = ?', [studySetId], function (err) {
      if (err) {
        rollbackTransaction();
        console.error('Error deleting files:', err);
        return res.status(500).json({ error: 'Error deleting files.' });
      }

      // Delete the study set record from the database
      db.run('DELETE FROM study_sets WHERE id = ?', [studySetId], function (err) {
        if (err) {
          rollbackTransaction();
          console.error('Error deleting study set:', err);
          return res.status(500).json({ error: 'Error deleting study set.' });
        }

        // Remove the study set directory and its contents from the filesystem
        fs.rmSync(studySetDir, { recursive: true, force: true });

        // Commit the transaction after successful deletion
        commitTransaction();
        res.status(200).json({ message: 'Study set deleted successfully.' });
      });
    });
  });
};

// Helper function to delete a file from the filesystem
/**
 * Deletes a file from the filesystem.
 * 
 * @param {string} filePath - The path to the file to be deleted.
 * @returns {Promise} - Resolves when the file is successfully deleted, or rejects with an error message.
 */
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
/**
 * Deletes a file entry from the study_set_files table in the database.
 * 
 * @param {number} fileId - The ID of the file entry to be deleted.
 * @returns {Promise} - Resolves when the file entry is successfully deleted from the database.
 */
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
/**
 * Deletes a file from both the database and the filesystem.
 * 
 * @param {number} fileId - The ID of the file to be deleted.
 * @param {string} filePath - The path to the file to be deleted from the filesystem.
 * @returns {Promise} - Resolves when the file is successfully deleted from both the database and the filesystem.
 */
const deleteFileFromDbAndFolder = (fileId, filePath) => {
  return deleteFileFromDb(fileId)
    .then(() => deleteFileFromFolder(filePath))
    .catch((err) => {
      throw err;
    });
};


// Controller to delete a specific file from a study set
/**
 * Controller function to delete a specific file from a study set.
 * 
 * 1. Extracts the file ID from the request parameters.
 * 2. Validates that the file ID is provided.
 * 3. Fetches the file path from the database using the file ID.
 * 4. If the file is found, calls the helper function to delete the file from the database and filesystem.
 * 5. If successful, sends a success response; if an error occurs, sends an error response.
 * 
 * @param {object} req - Express request object containing the file ID in the URL params.
 * @param {object} res - Express response object used to send the success/error response.
 */
const deleteFileFromStudySet = (req, res) => {
  const { fileId } = req.params;

  if (!fileId) {
    return res.status(400).json({ error: 'File ID is required.' });
  }

  db.get('SELECT file_path FROM study_set_files WHERE id = ?', [fileId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching file path from database.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'File not found.' });
    }

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
/**
 * Controller function to fetch all study guides for a specific study set.
 * 
 * 1. Extracts the study set ID from the request parameters.
 * 2. Queries the database to fetch all study guides associated with the study set ID.
 * 3. Sends the list of study guides as a response. If an error occurs, sends an error response.
 * 
 * @param {object} req - Express request object containing the study set ID in the URL params.
 * @param {object} res - Express response object used to send the study guides or error response.
 */
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
/**
 * Controller function to create a new study guide for a specific study set.
 * 
 * 1. Extracts the study set ID from the request parameters.
 * 2. Fetches all files associated with the study set from the database.
 * 3. If files are found, passes the file paths to the gemini.createStudyGuide function to generate guide content.
 * 4. Saves the generated study guide content in the database.
 * 5. Sends a success response with the created study guide. If an error occurs, sends an error response.
 * 
 * @param {object} req - Express request object containing the study set ID in the URL params and other necessary data in the body.
 * @param {object} res - Express response object used to send the success/error response.
 */
const createStudyGuide = (req, res) => {
  const { id: studySetId } = req.params;

  db.all('SELECT file_path FROM study_set_files WHERE study_set_id = ?', [studySetId], (err, rows) => {
    if (err) {
      console.error('Error fetching files:', err);
      return res.status(500).json({ error: 'Error fetching files.' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No files found for the given study set.' });
    }

    const filePaths = rows.map(row => row.file_path);

    gemini.createStudyGuide(filePaths)
      .then(guideContent => {
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
/**
 * Controller function to delete a study guide for a specific study set.
 * 
 * 1. Extracts the study set ID and guide ID from the request parameters.
 * 2. Queries the database to delete the study guide from the study_guides table.
 * 3. Sends a success response if the guide is deleted, or an error response if the guide is not found or if an error occurs.
 * 
 * @param {object} req - Express request object containing the study set ID and guide ID in the URL params.
 * @param {object} res - Express response object used to send the success/error response.
 */
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
/**
 * Controller function to fetch all quizzes for a specific study set.
 * 
 * 1. Extracts the study set ID from the request parameters.
 * 2. Queries the database to fetch all quizzes associated with the study set ID.
 * 3. Sends the list of quizzes as a response. If an error occurs, sends an error response.
 * 
 * @param {object} req - Express request object containing the study set ID in the URL params.
 * @param {object} res - Express response object used to send the quizzes or error response.
 */
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

// Controller to get a specific quiz for a study set
/**
 * Controller function to fetch a specific quiz by quiz ID for a specific study set.
 * 
 * 1. Extracts the quiz ID from the request parameters.
 * 2. Queries the database to fetch the quiz content.
 * 3. Sends the quiz content as a response. If an error occurs, sends an error response.
 * 
 * @param {object} req - Express request object containing the quiz ID in the URL params.
 * @param {object} res - Express response object used to send the quiz content or error response.
 */
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
/**
 * Controller function to create a new quiz for a specific study set.
 * 
 * 1. Extracts the study set ID from the request parameters.
 * 2. Fetches all files associated with the study set from the database.
 * 3. If files are found, passes the file paths to the gemini.createQuiz function to generate quiz content.
 * 4. Saves the generated quiz content in the database.
 * 5. Sends a success response with the created quiz. If an error occurs, sends an error response.
 * 
 * @param {object} req - Express request object containing the study set ID in the URL params and other necessary data in the body.
 * @param {object} res - Express response object used to send the success/error response.
 */
const createQuiz = (req, res) => {
  const { id: studySetId } = req.params;
  const { name, numQuestions, questions } = req.body;

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

    // Step 3: Pass the file paths to the gemini.createQuiz function
    gemini.createQuiz(filePaths, numQuestions)
      .then(guideContent => {
        // Step 4: Use the result as the quiz content
        db.run(
          'INSERT INTO quizzes (study_set_id, quiz_content) VALUES (?, ?)',
          [studySetId, guideContent],
          function (err) {
            if (err) {
              console.error('Error saving quiz:', err);
              return res.status(500).json({ error: 'Error saving quiz.' });
            }

            // Step 5: Send the success response with the created quiz
            res.status(201).json({
              message: 'Quiz created successfully.',
              study_set_id: studySetId,
              quiz_content: guideContent
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
/**
 * Controller function to delete a quiz for a specific study set.
 * 
 * 1. Extracts the study set ID and quiz ID from the request parameters.
 * 2. Queries the database to delete the quiz from the quizzes table.
 * 3. Sends a success response if the quiz is deleted, or an error response if the quiz is not found or if an error occurs.
 * 
 * @param {object} req - Express request object containing the study set ID and quiz ID in the URL params.
 * @param {object} res - Express response object used to send the success/error response.
 */
const deleteQuiz = (req, res) => {
  const { id: studySetId, quizId } = req.params;

  db.run('DELETE FROM quizzes WHERE id = ? AND study_set_id = ?', 
    [quizId, studySetId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Error deleting quiz.' });
    }
    // Step 3: Send the success response
    res.status(200).json({ message: 'Quiz deleted successfully.' });
  });
};

// Controller to create a new study plan
/**
 * Controller function to create a new study plan for a specific study set.
 * 
 * 1. Extracts the study set ID from the request parameters.
 * 2. Fetches all files associated with the study set from the database.
 * 3. Passes the file paths and the number of days to the gemini.createStudyPlan function to generate the study plan content.
 * 4. Saves the generated study plan content in the database.
 * 5. Sends a success response with the created study plan. If an error occurs, sends an error response.
 * 
 * @param {object} req - Express request object containing the study set ID in the URL params and the number of days in the body.
 * @param {object} res - Express response object used to send the success/error response.
 */
const createStudyPlan = (req, res) => {
  const { id: studySetId } = req.params;
  const { days } = req.body;

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

    // Step 3: Pass the file paths and days to the gemini.createStudyPlan function
    gemini.createStudyPlan(filePaths, days)
      .then(planContent => {
        // Step 4: Save the study plan to the database
        db.run(
          'INSERT INTO study_plans (study_set_id, plan_content) VALUES (?, ?)',
          [studySetId, planContent],
          function (err) {
            if (err) {
              console.error('Error saving study plan:', err);
              return res.status(500).json({ error: 'Error saving study plan.' });
            }

            // Step 5: Send the success response with the created study plan
            res.status(201).json({
              message: 'Study plan created successfully.',
              study_set_id: studySetId,
              plan_content: planContent
            });
          }
        );
      })
      .catch((error) => {
        console.error('Error creating study plan:', error);
        res.status(500).json({ error: 'Error creating study plan.' });
      });
  });
};

// Controller to fetch study plans for a specific study set
/**
 * Controller function to fetch all study plans for a specific study set.
 * 
 * 1. Extracts the study set ID from the request parameters.
 * 2. Queries the database to fetch all study plans associated with the study set ID.
 * 3. Sends the list of study plans as a response. If an error occurs, sends an error response.
 * 
 * @param {object} req - Express request object containing the study set ID in the URL params.
 * @param {object} res - Express response object used to send the study plans or error response.
 */
const getStudyPlansForStudySet = (req, res) => {
  const { id: studySetId } = req.params;

  db.all('SELECT * FROM study_plans WHERE study_set_id = ?', [studySetId], (err, rows) => {
    if (err) {
      console.error('Error fetching study plans:', err);
      return res.status(500).json({ error: 'Error fetching study plans.' });
    }
    res.json(rows);
  });
};

// Controller to delete a study plan
/**
 * Controller function to delete a study plan for a specific study set.
 * 
 * 1. Extracts the study set ID and plan ID from the request parameters.
 * 2. Queries the database to delete the study plan from the study_plans table.
 * 3. Sends a success response if the plan is deleted, or an error response if the plan is not found or if an error occurs.
 * 
 * @param {object} req - Express request object containing the study set ID and plan ID in the URL params.
 * @param {object} res - Express response object used to send the success/error response.
 */
const deleteStudyPlan = (req, res) => {
  const { id: studySetId, planId } = req.params;

  db.run('DELETE FROM study_plans WHERE id = ? AND study_set_id = ?', [planId, studySetId], function (err) {
    if (err) {
      console.error('Error deleting study plan:', err);
      return res.status(500).json({ error: 'Error deleting study plan.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Study plan not found.' });
    }
    res.json({ message: 'Study plan deleted successfully.' });
  });
};

// Export the following functions for use in routes
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
  createStudyPlan,
  getStudyPlansForStudySet,
  deleteStudyPlan,
};
