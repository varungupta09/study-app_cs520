const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5001;

const projectRoutes = require('./routes/projectRoutes');
const authRoutes = require('./routes/authRoutes');
const studyRoutes = require('./routes/studyRoutes');
const shareRoutes = require('./routes/shareRoutes');
const quizRoutes = require('./routes/quizRoutes');

// Enable CORS (Cross-Origin Resource Sharing)
/**
 * Enables CORS to allow requests from other origins, such as frontend applications.
 * 
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Middleware function to pass control to the next middleware.
 */
app.use(cors());

// Middleware for JSON and URL-encoded data parsing
/**
 * Middleware to parse incoming JSON data.
 * 
 * @param {object} req - Express request object containing JSON data.
 * @param {object} res - Express response object.
 * @param {function} next - Middleware function to pass control to the next middleware.
 */
app.use(express.json()); 

/**
 * Middleware to parse incoming URL-encoded data (for form submissions).
 * 
 * @param {object} req - Express request object containing URL-encoded data.
 * @param {object} res - Express response object.
 * @param {function} next - Middleware function to pass control to the next middleware.
 */
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files from the 'uploads' folder
/**
 * Middleware to serve static files (like images and documents) from the 'uploads' directory.
 * 
 * @param {object} req - Express request object containing file requests.
 * @param {object} res - Express response object used to send the file.
 */
app.use(express.static(path.join(__dirname, 'uploads'))); 

// Use authentication routes
/**
 * Uses the authentication routes (login, registration, etc.) at the '/auth' endpoint.
 * 
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Middleware function to pass control to the next middleware.
 */
app.use('/auth', authRoutes);

// Use project-related routes
/**
 * Uses project-related routes for handling requests related to projects.
 * 
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Middleware function to pass control to the next middleware.
 */
app.use('/', projectRoutes);

// Use study set-related routes
/**
 * Uses study set-related routes (creating, fetching, and managing study sets) at the '/api' endpoint.
 * 
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Middleware function to pass control to the next middleware.
 */
app.use('/api', studyRoutes);

// Use sharing functionality routes
/**
 * Uses routes for sharing study sets at the '/api/share' endpoint.
 * 
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Middleware function to pass control to the next middleware.
 */
app.use('/api/share', shareRoutes);

// Use quiz-related routes
/**
 * Uses quiz-related routes for handling quizzes and quiz results at the '/api/quizzes' endpoint.
 * 
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Middleware function to pass control to the next middleware.
 */
app.use('/api/quizzes', quizRoutes);

// Serve static files from the frontend build (for production)
 /**
  * Serves the static assets from the frontend build (React app) for the production environment.
  * 
  * @param {object} req - Express request object for static files.
  * @param {object} res - Express response object used to send static files.
  */
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// Export the app for testing
module.exports = app;

// Start the server
/**
 * Starts the Express server and listens on the specified port (default: 5001).
 * 
 * @param {function} callback - A callback function that runs once the server is successfully started.
 */
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}
