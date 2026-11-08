const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const databasePath = process.env.DB_PATH || './data/books.db';
const resolvedDatabasePath = path.resolve(databasePath);
fs.mkdirSync(path.dirname(resolvedDatabasePath), { recursive: true });

const db = new sqlite3.Database(resolvedDatabasePath, (error) => {
  if (error) {
    console.error('Unable to open the SQLite database.');
    process.exitCode = 1;
  }
});

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function onRun(error) {
    if (error) {
      reject(error);
      return;
    }
    resolve({ id: this.lastID, changes: this.changes });
  });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (error, rows) => {
    if (error) {
      reject(error);
      return;
    }
    resolve(rows);
  });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (error, row) => {
    if (error) {
      reject(error);
      return;
    }
    resolve(row);
  });
});

const initializeDatabase = async () => {
  await run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price REAL NOT NULL
  )`);

  const existingCount = await get('SELECT COUNT(*) AS count FROM books');
  if (existingCount.count === 0) {
    const sampleBooks = [
      ['The Alchemist', 'Paulo Coelho', 299.00],
      ['Clean Code', 'Robert C. Martin', 799.00],
      ['The Pragmatic Programmer', 'Andrew Hunt and David Thomas', 649.50],
      ['Wings of Fire', 'A. P. J. Abdul Kalam', 350.00]
    ];

    for (const book of sampleBooks) {
      await run('INSERT INTO books (title, author, price) VALUES (?, ?, ?)', book);
    }
  }
};

if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log(`Database initialized at ${resolvedDatabasePath}`);
      db.close((error) => {
        if (error) process.exitCode = 1;
      });
    })
    .catch((error) => {
      console.error('Database initialization failed:', error.message);
      db.close();
      process.exitCode = 1;
    });
}

module.exports = { db, run, all, get, initializeDatabase };
