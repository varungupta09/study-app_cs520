// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatControllers');

// Route to fetch all messages for a given study set
router.get('/:studySetId', chatController.getMessages);

// Route to post a new message to a chat for a study set
router.post('/:studySetId', chatController.postMessage);

module.exports = router;
