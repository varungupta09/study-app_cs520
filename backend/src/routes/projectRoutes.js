const express = require('express');
const router = express.Router();
const { getHomePage, getNewProjectPage, getProjectLibraryPage } = require('../controllers/projectController');

// Route to fetch the homepage
/**
 * Handles GET requests to the home page.
 * 
 * 1. Listens for GET requests at the '/' endpoint.
 * 2. Calls the getHomePage function from the projectController to fetch the homepage content.
 * 3. Sends the homepage content as the response.
 * 
 * @param {object} req - Express request object for the home page request.
 * @param {object} res - Express response object used to send the homepage content.
 */
router.get('/', getHomePage);

// Route to fetch the new project page
/**
 * Handles GET requests to the new project page.
 * 
 * 1. Listens for GET requests at the '/new-project' endpoint.
 * 2. Calls the getNewProjectPage function from the projectController to fetch the new project page content.
 * 3. Sends the new project page content as the response.
 * 
 * @param {object} req - Express request object for the new project page request.
 * @param {object} res - Express response object used to send the new project page content.
 */
router.get('/new-project', getNewProjectPage);

// Route to fetch the project library page
/**
 * Handles GET requests to the project library page.
 * 
 * 1. Listens for GET requests at the '/project-library' endpoint.
 * 2. Calls the getProjectLibraryPage function from the projectController to fetch the project library page content.
 * 3. Sends the project library page content as the response.
 * 
 * @param {object} req - Express request object for the project library page request.
 * @param {object} res - Express response object used to send the project library page content.
 */
router.get('/project-library', getProjectLibraryPage);

module.exports = router;
