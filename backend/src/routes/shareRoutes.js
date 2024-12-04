const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareControllers');

// Share a study set
router.post('/', shareController.shareStudySet);

// Fetch study sets shared with the user
router.get('/shared-with-me/:userId', shareController.getSharedStudySets);

// Revoke access to a study set
router.delete('/', shareController.revokeAccess);

module.exports = router;