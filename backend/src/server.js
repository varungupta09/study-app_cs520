const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5001;

const projectRoutes = require('./routes/projectRoutes');
const authRoutes = require('./routes/authRoutes');
const studyRoutes = require('./routes/studyRoutes');

app.use(cors());

// Middleware for JSON and URL-encoded data parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware for file parsing
app.use(express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// Use auth routes
app.use('/auth', authRoutes);

// Use project routes
app.use('/', projectRoutes);

// Use study routes
app.use('/api', studyRoutes);

// Serve static files from the frontend build (this should be after the routes)
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// Start the server on the specified port
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
