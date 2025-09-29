const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite database path
const dbPath = path.join(__dirname, '..', 'freya_chat.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('SQLite database ulanish xatosi:', err);
    process.exit(-1);
  } else {
    console.log('SQLite database muvaffaqiyatli ulandi');
  }
});

// Query function to match PostgreSQL interface
const query = async (text, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(text, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve({ rows });
      }
    });
  });
};

// Get client function (for compatibility)
const getClient = async () => {
  return {
    query: query,
    release: () => {}
  };
};

module.exports = {
  query,
  getClient,
  pool: { query } // For compatibility
};