const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database
const db = new sqlite3.Database(path.resolve(__dirname, 'studyapp.db'), (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create `users` table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table ready.');
    }
  });

  // Create `study_sets` table with additional columns
  db.run(`
    CREATE TABLE IF NOT EXISTS study_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      modification_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating study_sets table:', err);
    } else {
      console.log('Study sets table ready.');
    }
  });

  // Create `study_set_files` table to store uploaded file details
  db.run(`
    CREATE TABLE IF NOT EXISTS study_set_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      study_set_id INTEGER,
      file_path TEXT NOT NULL,
      FOREIGN KEY (study_set_id) REFERENCES study_sets(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating study_set_files table:', err);
    } else {
      console.log('Study set files table ready.');
    }
  });

  // Create `study_guides` table to store study guides in JSON format
  db.run(`
    CREATE TABLE IF NOT EXISTS study_guides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      study_set_id INTEGER NOT NULL,
      guide_content TEXT NOT NULL,  -- Store the guide in JSON format as TEXT
      creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      modification_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (study_set_id) REFERENCES study_sets(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating study_guides table:', err);
    } else {
      console.log('Study guides table ready.');
    }
  });

  // Create `quizzes` table to store quizzes in JSON format
  db.run(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      study_set_id INTEGER NOT NULL,
      quiz_content TEXT NOT NULL,  -- Store quiz questions in JSON format as TEXT
      creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      modification_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (study_set_id) REFERENCES study_sets(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating quizzes table:', err);
    } else {
      console.log('Quizzes table ready.');
    }
  });
});

module.exports = db;
