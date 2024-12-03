// routes/studyRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const studyController = require('../controllers/studyControllers'); // Import the controller
const router = express.Router();

// Setup file upload using multer
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

// Route to create study set and upload files
router.post('/study-set', upload.array('files', 5), studyController.createStudySet); // Use controller method

// Route to get all study sets
router.get('/study-sets', studyController.getAllStudySets); // Use controller method

// Route to get files for a specific study set
router.get('/study-set/:id/files', studyController.getFilesForStudySet); // Use controller method

// Route to get specific study set details
router.get('/study-set/:id', studyController.getStudySetDetails); // Add the new route here

// Route to update study set
router.put('/study-set/:id', upload.array('files', 5), studyController.updateStudySet); // Use controller method

// Route to delete a study set
router.delete('/study-set/:id', studyController.deleteStudySet);  // Add this line

//Route to delete a file
router.delete('/study-set/file/:fileId', studyController.deleteFileFromStudySet);

// Routes for study guides
router.get('/study-set/:id/study-guides', studyController.getStudyGuidesForStudySet); // Fetch study guides
router.post('/study-set/:id/study-guides', studyController.createStudyGuide); // Create a study guide
router.delete('/study-set/:id/study-guides/:guideId', studyController.deleteStudyGuide); // Delete a study guide

// Route to fetch all quizzes for a specific study set
router.get('/study-set/:id/quizzes', studyController.getQuizzesForStudySet);

// Route to fetch a specific quiz for a specific study set
router.get('/study-set/quiz/:id', studyController.getQuizForStudySet);

// Route to create a quiz for a specific study set
router.post('/study-set/:id/quizzes', studyController.createQuiz);

// Route to delete a quiz for a specific study set
router.delete('/study-set/:id/quizzes/:quizId', studyController.deleteQuiz);


module.exports = router;
