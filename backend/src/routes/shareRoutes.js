const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareControllers');

// Route to share a study set
/**
 * Handles POST requests to share a study set.
 * 
 * 1. Listens for POST requests at the '/' endpoint.
 * 2. Calls the shareStudySet function from the shareController to share a study set.
 * 3. Sends a response confirming the study set has been shared.
 * 
 * @param {object} req - Express request object containing the study set details in the body.
 * @param {object} res - Express response object used to send a success or error response.
 */
router.post('/', shareController.shareStudySet);

// Route to fetch study sets shared with the user
/**
 * Handles GET requests to fetch study sets shared with the user.
 * 
 * 1. Extracts the user ID from the request parameters.
 * 2. Calls the getSharedStudySets function from the shareController to fetch the study sets shared with the user.
 * 3. Sends the list of shared study sets as a response.
 * 
 * @param {object} req - Express request object containing the user ID in the URL params.
 * @param {object} res - Express response object used to send the list of shared study sets or an error response.
 */
router.get('/shared-with-me/:userId', shareController.getSharedStudySets);

// Route to revoke access to a study set
/**
 * Handles DELETE requests to revoke access to a study set.
 * 
 * 1. Listens for DELETE requests at the '/' endpoint.
 * 2. Calls the revokeAccess function from the shareController to revoke the user's access to a study set.
 * 3. Sends a response confirming the access has been revoked.
 * 
 * @param {object} req - Express request object containing the study set details in the body.
 * @param {object} res - Express response object used to send a success or error response.
 */
router.delete('/', shareController.revokeAccess);

module.exports = router;
