const express = require('express');
const { signup, login } = require('../controllers/authControllers');

const router = express.Router();

// Route to handle user signup
/**
 * Handles user signup.
 * 
 * 1. Listens for POST requests at the '/signup' endpoint.
 * 2. Calls the signup function from the authControllers to handle the signup process.
 * 3. The signup function processes the request and sends the appropriate response.
 * 
 * @param {object} req - Express request object containing user signup data.
 * @param {object} res - Express response object used to send the signup response.
 */
router.post('/signup', signup);

// Route to handle user login
/**
 * Handles user login.
 * 
 * 1. Listens for POST requests at the '/login' endpoint.
 * 2. Calls the login function from the authControllers to handle the login process.
 * 3. The login function processes the request and sends the appropriate response.
 * 
 * @param {object} req - Express request object containing user login credentials.
 * @param {object} res - Express response object used to send the login response.
 */
router.post('/login', login);

module.exports = router;
