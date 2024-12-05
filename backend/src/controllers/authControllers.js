// Import required modules
const bcrypt = require('bcrypt'); // For hashing and comparing passwords securely
const db = require('../database'); // Database connection module
const jwt = require('jsonwebtoken'); // For generating and verifying JSON Web Tokens (JWT)
const env = require("dotenv").config(); // For managing environment variables from a .env file

// Load JWT secret from environment variables or fallback to a default (insecure for production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// Debug: Ensure the JWT secret is loaded correctly
console.log(JWT_SECRET); 

/**
 * Helper function to validate email format.
 * Uses a regular expression to check if the provided email matches a standard pattern.
 * 
 * @param {string} email - The email address to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic regex for validating email
  return emailRegex.test(email); // Returns true if email matches regex, false otherwise
};

/**
 * Controller to handle user signup.
 * 
 * 1. Validates input for required fields and proper email format.
 * 2. Checks if the email already exists in the database.
 * 3. Hashes the password securely before saving it to the database.
 * 4. Sends an appropriate HTTP response based on the outcome.
 * 
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const signup = async (req, res) => {
  console.log("Received signup request"); // Debug: Log incoming signup requests

  const { username, password } = req.body; // Extract username and password from the request body

  // Validate input fields
  if (!username || !password) {
    return res.status(400).send('Email and password are required.');
  }

  // Validate email format
  if (!isValidEmail(username)) {
    return res.status(400).send('Invalid email format.');
  }

  try {
    // Check if the username (email) already exists in the database
    db.get('SELECT username FROM users WHERE username = ?', [username], async (err, existingUser) => {
      if (err) {
        console.error(err); // Log database query error
        return res.status(500).send('Error checking email in the database.');
      }

      // If the email already exists in the database, send a 409 Conflict response
      if (existingUser) {
        return res.status(409).send('Email already in use.');
      }

      // Hash the user's password before storing it
      const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10 (adjust for your security needs)

      // Insert the new user into the database
      db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword],
        function (err) {
          if (err) {
            console.error(err); // Log database insertion error
            return res.status(500).send('Error creating user.');
          }
          // Respond with success once the user is created
          res.status(201).send('User created.');
        }
      );
    });
  } catch (error) {
    console.error(error); // Catch and log unexpected errors
    res.status(500).send('Unexpected error occurred during signup.');
  }
};

/**
 * Controller to handle user login.
 * 
 * 1. Validates input for required fields.
 * 2. Verifies that the username exists and the password is correct.
 * 3. Generates a JWT token for the user upon successful authentication.
 * 4. Sends the token and user details in the response.
 * 
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const login = (req, res) => {
  const { username, password } = req.body; // Extract username and password from the request body

  // Validate input fields
  if (!username || !password) {
    return res.status(400).send('Email and password are required.');
  }

  // Query the database for the user with the provided username (email)
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      console.error(err); // Log database query error
      return res.status(500).send('Error fetching user.');
    }

    // Validate if the user exists and if the password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send('Invalid credentials.'); // Unauthorized if the credentials don't match
    }

    // Generate a JSON Web Token for the authenticated user
    const token = jwt.sign(
      { userId: user.id }, // Payload: user ID
      JWT_SECRET,         // Secret key for signing
      { expiresIn: '24h' } // Token expiration time (24 hours)
    );

    // Respond with the token and basic user information
    res.status(200).send({
      message: 'Login successful!',
      userId: user.id,
      username: user.username,
      token // Include the token for authentication in subsequent requests
    });
  });
};

// Export the signup and login functions for use in routes
module.exports = { signup, login };
