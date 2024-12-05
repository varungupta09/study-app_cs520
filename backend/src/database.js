// Import SQLite3 and path modules
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database
/**
 * Establishes a connection to the SQLite database 'studyapp.db'.
 * If an error occurs, it logs the error, otherwise it confirms the successful connection.
 * 
 * @param {Error} err - Error object if the connection fails.
 */
const db = new sqlite3.Database(path.resolve(__dirname, 'studyapp.db'), (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create `users` table if it doesn't exist
/**
 * Creates the 'users' table to store user details if it does not already exist.
 * Columns include:
 *  - id: Unique user ID (Primary Key).
 *  - username: Unique username for each user.
 *  - password: User's password (hashed).
 */
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
  /**
   * Creates the 'study_sets' table to store study set information if it does not already exist.
   * Columns include:
   *  - id: Unique study set ID (Primary Key).
   *  - user_id: ID of the user who created the study set (Foreign Key referencing users table).
   *  - name: Name of the study set.
   *  - description: Optional description for the study set.
   *  - creation_date: Timestamp of when the study set was created.
   *  - modification_date: Timestamp of the last modification of the study set.
   */
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
  /**
   * Creates the 'study_set_files' table to store file paths of uploaded files for a study set.
   * Columns include:
   *  - id: Unique file ID (Primary Key).
   *  - study_set_id: ID of the associated study set (Foreign Key referencing study_sets table).
   *  - file_path: Path to the uploaded file.
   */
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
  /**
   * Creates the 'study_guides' table to store study guides in JSON format.
   * Columns include:
   *  - id: Unique guide ID (Primary Key).
   *  - study_set_id: ID of the associated study set (Foreign Key referencing study_sets table).
   *  - guide_content: Guide content in JSON format (TEXT).
   *  - creation_date: Timestamp of when the study guide was created.
   *  - modification_date: Timestamp of the last modification of the study guide.
   */
  db.run(`
    CREATE TABLE IF NOT EXISTS study_guides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      study_set_id INTEGER NOT NULL,
      guide_content TEXT NOT NULL,
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
  /**
   * Creates the 'quizzes' table to store quiz questions and answers in JSON format.
   * Columns include:
   *  - id: Unique quiz ID (Primary Key).
   *  - study_set_id: ID of the associated study set (Foreign Key referencing study_sets table).
   *  - quiz_content: Quiz content in JSON format (TEXT).
   *  - creation_date: Timestamp of when the quiz was created.
   *  - modification_date: Timestamp of the last modification of the quiz.
   */
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

  // Create `study_plans` table to store study plans in JSON format
  /**
   * Creates the 'study_plans' table to store study plans in JSON format.
   * Columns include:
   *  - id: Unique study plan ID (Primary Key).
   *  - study_set_id: ID of the associated study set (Foreign Key referencing study_sets table).
   *  - plan_content: Study plan content in JSON format (TEXT).
   *  - creation_date: Timestamp of when the study plan was created.
   *  - modification_date: Timestamp of the last modification of the study plan.
   */
  db.run(`
    CREATE TABLE IF NOT EXISTS study_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      study_set_id INTEGER NOT NULL,
      plan_content TEXT NOT NULL,
      creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      modification_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (study_set_id) REFERENCES study_sets(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating study_plans table:', err);
    } else {
      console.log('Study plans table ready.');
    }
  });
});

// Create `study_set_shares` table to track study set sharing
/**
 * Creates the 'study_set_shares' table to store information about shared study sets.
 * Columns include:
 *  - id: Unique share ID (Primary Key).
 *  - study_set_id: ID of the associated study set (Foreign Key referencing study_sets table).
 *  - shared_with_user_id: ID of the user who has been shared the study set (Foreign Key referencing users table).
 *  - shared_by_user_id: ID of the user who shared the study set (Foreign Key referencing users table).
 *  - share_date: Timestamp of when the study set was shared.
 */
db.run(`
  CREATE TABLE IF NOT EXISTS study_set_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    study_set_id INTEGER NOT NULL,
    shared_with_user_id INTEGER NOT NULL,
    shared_by_user_id INTEGER NOT NULL,
    share_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (study_set_id) REFERENCES study_sets(id),
    FOREIGN KEY (shared_with_user_id) REFERENCES users(id),
    FOREIGN KEY (shared_by_user_id) REFERENCES users(id),
    UNIQUE (study_set_id, shared_with_user_id)
  )
`, (err) => {
  if (err) {
    console.error('Error creating study_set_shares table:', err);
  } else {
    console.log('Study set shares table ready.');
  }
});

// Create `quiz_scores` table to store quiz scores
/**
 * Creates the 'quiz_scores' table to store the scores of quizzes taken by users.
 * Columns include:
 *  - id: Unique score ID (Primary Key).
 *  - user_id: ID of the user who took the quiz (Foreign Key referencing users table).
 *  - quiz_id: ID of the quiz (Foreign Key referencing quizzes table).
 *  - score: Score achieved by the user on the quiz.
 *  - taken_date: Timestamp of when the quiz was taken.
 */
db.run(`
  CREATE TABLE IF NOT EXISTS quiz_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    quiz_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    taken_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
    UNIQUE (user_id, quiz_id, taken_date)
  )
`, (err) => {
  if (err) {
    console.error('Error creating quiz_scores table:', err);
  } else {
    console.log('Quiz scores table ready.');
  }
});

module.exports = db;
