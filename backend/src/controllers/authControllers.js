const bcrypt = require('bcrypt');
const db = require('../database');
const jwt = require('jsonwebtoken');
const env = require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

console.log(JWT_SECRET)
// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email regex
  return emailRegex.test(email);
};

// Signup controller
const signup = async (req, res) => {
  console.log("Received signup request");

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Email and password are required.');
  }

  if (!isValidEmail(username)) {
    return res.status(400).send('Invalid email format.');
  }

  try {
    db.get('SELECT username FROM users WHERE username = ?', [username], async (err, existingUser) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error checking email in the database.');
      }

      if (existingUser) {
        return res.status(409).send('Email already in use.');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(500).send('Error creating user.');
          }
          res.status(201).send('User created.');
        }
      );
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Unexpected error occurred during signup.');
  }
};

// Login controller
const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Email and password are required.');
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching user.');
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send('Invalid credentials.');
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(200).send({
      message: 'Login successful!',
      userId: user.id,
      username: user.username,
      token
    });
  });
};

module.exports = { signup, login };
