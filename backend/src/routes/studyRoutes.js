const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const studyController = require('../controllers/studyControllers');
const router = express.Router();

// Setup file upload using multer
/**
 * Configures multer for file uploads.
 * - Files will be saved in a temporary directory.
 * - The filenames are timestamped to avoid conflicts.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempPath = './uploads/tmp'; // Temporary storage path
    fs.mkdirSync(tempPath, { recursive: true }); // Ensure the directory exists
    cb(null, tempPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use timestamp to avoid file name conflicts
  }
});

const upload = multer({ storage: storage });

// Route to create a study set and upload files
/**
 * Handles POST requests to create a new study set and upload files.
 * 
 * 1. Listens for POST requests at '/study-set'.
 * 2. Allows up to 5 files to be uploaded with the field name 'files'.
 * 3. Calls the createStudySet function from the studyController to create the study set.
 * 4. Sends a response confirming the creation of the study set.
 * 
 * @param {object} req - Express request object containing study set data and files in the body.
 * @param {object} res - Express response object used to send success or error response.
 */
router.post('/study-set', upload.array('files', 5), studyController.createStudySet);

// Route to get all study sets
/**
 * Handles GET requests to fetch all available study sets.
 * 
 * 1. Listens for GET requests at '/study-sets'.
 * 2. Calls the getAllStudySets function from the studyController to retrieve the study sets.
 * 3. Sends the list of all study sets as a response.
 * 
 * @param {object} req - Express request object.
 * @param {object} res - Express response object used to send the list of study sets.
 */
router.get('/study-sets', studyController.getAllStudySets);

// Route to get files for a specific study set
/**
 * Handles GET requests to fetch files associated with a specific study set.
 * 
 * 1. Extracts the study set ID from the URL parameters.
 * 2. Calls the getFilesForStudySet function from the studyController to fetch the files.
 * 3. Sends the list of files as a response.
 * 
 * @param {object} req - Express request object containing the study set ID in the URL params.
 * @param {object} res - Express response object used to send the list of files or an error response.
 */
router.get('/study-set/:id/files', studyController.getFilesForStudySet);

// Route to get specific study set details
/**
 * Handles GET requests to fetch details for a specific study set.
 * 
 * 1. Extracts the study set ID from the URL parameters.
 * 2. Calls the getStudySetDetails function from the studyController to retrieve the study set details.
 * 3. Sends the study set details as a response.
 * 
 * @param {object} req - Express request object containing the study set ID in the URL params.
 * @param {object} res - Express response object used to send the study set details or an error response.
 */
router.get('/study-set/:id', studyController.getStudySetDetails);

// Route to update study set
/**
 * Handles PUT requests to update an existing study set and its files.
 * 
 * 1. Allows up to 5 files to be uploaded with the field name 'files'.
 * 2. Extracts the study set ID from the URL parameters.
 * 3. Calls the updateStudySet function from the studyController to update the study set.
 * 4. Sends a response confirming the update.
 * 
 * @param {object} req - Express request object containing the study set ID, new study set data, and files in the body.
 * @param {object} res - Express response object used to send success or error response.
 */
router.put('/study-set/:id', upload.array('files', 5), studyController.updateStudySet);

// Route to delete a study set
/**
 * Handles DELETE requests to delete a specific study set.
 * 
 * 1. Extracts the study set ID from the URL parameters.
 * 2. Calls the deleteStudySet function from the studyController to delete the study set.
 * 3. Sends a response confirming the deletion.
 * 
 * @param {object} req - Express request object containing the study set ID in the URL params.
 * @param {object} res - Express response object used to send success or error response.
 */
router.delete('/study-set/:id', studyController.deleteStudySet);

// Route to delete a file from a study set
/**
 * Handles DELETE requests to remove a specific file from a study set.
 * 
 * 1. Extracts the file ID from the URL parameters.
 * 2. Calls the deleteFileFromStudySet function from the studyController to remove the file.
 * 3. Sends a response confirming the deletion.
 * 
 * @param {object} req - Express request object containing the file ID in the URL params.
 * @param {object} res - Express response object used to send success or error response.
 */
router.delete('/study-set/file/:fileId', studyController.deleteFileFromStudySet);

// Routes for study guides
/**
 * Handles GET requests to fetch all study guides for a specific study set.
 * 
 * 1. Extracts the study set ID from the URL parameters.
 * 2. Calls the getStudyGuidesForStudySet function from the studyController to fetch the guides.
 * 3. Sends the list of study guides as a response.
 * 
 * @param {object} req - Express request object containing the study set ID in the URL params.
 * @param {object} res - Express response object used to send the list of study guides.
 */
router.get('/study-set/:id/study-guides', studyController.getStudyGuidesForStudySet);

/**
 * Handles POST requests to create a new study guide for a specific study set.
 * 
 * 1. Extracts the study set ID from the URL parameters.
 * 2. Calls the createStudyGuide function from the studyController to create the study guide.
 * 3. Sends a response confirming the creation of the study guide.
 * 
 * @param {object} req - Express request object containing the study set ID and study guide data in the body.
 * @param {object} res - Express response object used to send success or error response.
 */
router.post('/study-set/:id/study-guides', studyController.createStudyGuide);

/**
 * Handles DELETE requests to delete a specific study guide from a study set.
 * 
 * 1. Extracts the study set ID and study guide ID from the URL parameters.
 * 2. Calls the deleteStudyGuide function from the studyController to delete the study guide.
 * 3. Sends a response confirming the deletion.
 * 
 * @param {object} req - Express request object containing the study set ID and study guide ID in the URL params.
 * @param {object} res - Express response object used to send success or error response.
 */
router.delete('/study-set/:id/study-guides/:guideId', studyController.deleteStudyGuide);

// Routes for quizzes
/**
 * Handles GET requests to fetch all quizzes for a specific study set.
 * 
 * 1. Extracts the study set ID from the URL parameters.
 * 2. Calls the getQuizzesForStudySet function from the studyController to fetch the quizzes.
 * 3. Sends the list of quizzes as a response.
 * 
 * @param {object} req - Express request object containing the study set ID in the URL params.
 * @param {object} res - Express response object used to send the list of quizzes.
 */
router.get('/study-set/:id/quizzes', studyController.getQuizzesForStudySet);

/**
 * Handles GET requests to fetch a specific quiz for a specific study set.
 * 
 * 1. Extracts the quiz ID from the URL parameters.
 * 2. Calls the getQuizForStudySet function from the studyController to fetch quiz details.
 * 3. Sends the quiz details as a response.
 * 
 * @param {object} req - Express request object containing the quiz ID in the URL params.
 * @param {object} res - Express response object used to send the quiz details.
 */
router.get('/study-set/quiz/:id', studyController.getQuizForStudySet);

/**
 * Handles POST requests to create a new quiz for a specific study set.
 * 
 * 1. Extracts the study set ID from the URL parameters.
 * 2. Calls the createQuiz function from the studyController to create the quiz.
 * 3. Sends a response confirming the quiz creation.
 * 
 * @param {object} req - Express request object containing the study set ID and quiz data in the body.
 * @param {object} res - Express response object used to send success or error response.
 */
router.post('/study-set/:id/quizzes', studyController.createQuiz);

// Route to delete a quiz for a specific study set
/**
 * Handles DELETE requests to delete a specific quiz from a study set.
 * 
 * 1. Extracts the study set ID and quiz ID from the URL parameters.
 * 2. Calls the deleteQuiz function from the studyController to delete the quiz.
 * 3. Sends a response confirming the deletion.
 * 
 * @param {object} req - Express request object containing the study set ID and quiz ID in the URL params.
 * @param {object} res - Express response object used to send success or error response.
 */
router.delete('/study-set/:id/quizzes/:quizId', studyController.deleteQuiz);

// Route to create a study plan
/**
 * Handles POST requests to create a study plan for a specific study set.
 * 
 * 1. Extracts the study set ID from the URL parameters.
 * 2. Calls the createStudyPlan function from the studyController to create the study plan.
 * 3. Sends a response confirming the creation of the study plan.
 * 
 * @param {object} req - Express request object containing the study set ID and study plan data in the body.
 * @param {object} res - Express response object used to send success or error response.
 */
router.post('/study-set/:id/study-plan', studyController.createStudyPlan);

// Route to fetch all study plans for a specific study set
/**
 * Handles GET requests to fetch all study plans for a specific study set.
 * 
 * 1. Extracts the study set ID from the URL parameters.
 * 2. Calls the getStudyPlansForStudySet function from the studyController to fetch the study plans.
 * 3. Sends the list of study plans as a response.
 * 
 * @param {object} req - Express request object containing the study set ID in the URL params.
 * @param {object} res - Express response object used to send the list of study plans.
 */
router.get('/study-set/:id/study-plans', studyController.getStudyPlansForStudySet);

// Route to delete a study plan
/**
 * Handles DELETE requests to delete a specific study plan for a study set.
 * 
 * 1. Extracts the study set ID and study plan ID from the URL parameters.
 * 2. Calls the deleteStudyPlan function from the studyController to delete the study plan.
 * 3. Sends a response confirming the deletion.
 * 
 * @param {object} req - Express request object containing the study set ID and study plan ID in the URL params.
 * @param {object} res - Express response object used to send success or error response.
 */
router.delete('/study-set/:id/study-plans/:planId', studyController.deleteStudyPlan);

module.exports = router;

