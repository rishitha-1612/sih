const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'kisaan.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      name TEXT,
      language TEXT,
      location TEXT,
      crop_type TEXT,
      soil_type TEXT,
      points INTEGER DEFAULT 0,
      points_today INTEGER DEFAULT 0,
      last_point_date TEXT,
      role TEXT DEFAULT 'farmer'
    )`);

    // Migration: add missing columns safely
    db.all("PRAGMA table_info(users)", (err, rows) => {
      // We check for 'last_point_date' to see if this migration ran
      if (!err && rows && !rows.some(r => r.name === 'last_point_date')) {
        console.log("Migrating users table to add points tracking and auth...");
        db.serialize(() => {
          db.run("ALTER TABLE users RENAME TO users_old");
          db.run(`CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT,
            name TEXT,
            language TEXT,
            location TEXT,
            crop_type TEXT,
            soil_type TEXT,
            points INTEGER DEFAULT 0,
            points_today INTEGER DEFAULT 0,
            last_point_date TEXT,
            role TEXT DEFAULT 'farmer'
          )`);

          const hasEmail = rows.some(r => r.name === 'email');
          if (hasEmail) {
            db.run(`INSERT INTO users (id, phone, email, password, name, language, location, crop_type, soil_type, points, role)
                      SELECT id, phone, email, password, name, language, location, crop_type, soil_type, points, role FROM users_old`);
          } else {
            db.run(`INSERT INTO users (id, phone, name, language, location, crop_type, soil_type, points, role)
                      SELECT id, phone, name, language, location, crop_type, soil_type, points, role FROM users_old`);
          }
          db.run("DROP TABLE users_old");
        });
      }
    });

    // Chats Table
    db.run(`CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      message TEXT,
      is_bot_reply INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Scans Table
    db.run(`CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      image_url TEXT,
      disease_predicted TEXT,
      confidence TEXT,
      treatment TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
  });
}

module.exports = db;
