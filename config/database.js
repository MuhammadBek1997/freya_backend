const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// SQLite database path
const dbPath = path.join(__dirname, '..', 'freya_chat.db');

// Create SQLite database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('SQLite database xatosi:', err);
    process.exit(-1);
  } else {
    console.log('SQLite database ga ulanish muvaffaqiyatli');
    
    // Create tables if they don't exist
    initializeTables();
  }
});

// Initialize database tables
function initializeTables() {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Employees table
  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT,
    position TEXT,
    salon_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // User chats table
  db.run(`CREATE TABLE IF NOT EXISTS user_chats (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    sender_type TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    receiver_type TEXT NOT NULL,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('Database tables initialized');
}

// Database query helper function (adapted for SQLite)
const query = async (text, params = []) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    
    // Convert PostgreSQL syntax to SQLite
    let sqliteQuery = text
      .replace(/\$(\d+)/g, '?') // Replace $1, $2, etc. with ?
      .replace(/RETURNING \*/g, '') // Remove RETURNING clause
      .replace(/NOW\(\)/g, 'CURRENT_TIMESTAMP'); // Replace NOW() with CURRENT_TIMESTAMP
    
    if (sqliteQuery.includes('INSERT') && text.includes('RETURNING')) {
      // For INSERT queries that need to return the inserted row
      db.run(sqliteQuery, params, function(err) {
        if (err) {
          console.error('Database query error:', err);
          reject(err);
        } else {
          const duration = Date.now() - start;
          console.log('Query executed:', { text: sqliteQuery, duration, rows: this.changes });
          resolve({ rows: [{ id: this.lastID }], rowCount: this.changes });
        }
      });
    } else if (sqliteQuery.includes('SELECT')) {
      // For SELECT queries
      db.all(sqliteQuery, params, (err, rows) => {
        if (err) {
          console.error('Database query error:', err);
          reject(err);
        } else {
          const duration = Date.now() - start;
          console.log('Query executed:', { text: sqliteQuery, duration, rows: rows.length });
          resolve({ rows, rowCount: rows.length });
        }
      });
    } else {
      // For UPDATE, DELETE queries
      db.run(sqliteQuery, params, function(err) {
        if (err) {
          console.error('Database query error:', err);
          reject(err);
        } else {
          const duration = Date.now() - start;
          console.log('Query executed:', { text: sqliteQuery, duration, rows: this.changes });
          resolve({ rowCount: this.changes });
        }
      });
    }
  });
};

// Get a client from the pool (not needed for SQLite, but keeping for compatibility)
const getClient = async () => {
  return db;
};

module.exports = {
  query,
  getClient,
  pool: db
};