const express = require('express');
const router = express.Router();
const { getHomePage, getNewProjectPage, getProjectLibraryPage } = require('../controllers/projectController');

router.get('/', getHomePage);
router.get('/new-project', getNewProjectPage);
router.get('/project-library', getProjectLibraryPage);

module.exports = router;
