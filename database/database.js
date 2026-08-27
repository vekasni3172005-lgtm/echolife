const Database = require("better-sqlite3");

// Open / create EchoLife database
const db = new Database("./database/echolife.db");

// Enable foreign keys
db.pragma("foreign_keys = ON");

// =====================================================
// USERS TABLE
// =====================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// =====================================================
// PROFILES TABLE
// =====================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        full_name TEXT,
        bio TEXT,
        profile_image TEXT,
        location TEXT,
        date_of_birth TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );
`);
// =====================================================
// MEMORIES TABLE
// =====================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        user_id INTEGER NOT NULL,

        title TEXT NOT NULL,
        description TEXT,
        memory_date TEXT NOT NULL,
        location TEXT,

        emotion TEXT,
        category TEXT,
        type TEXT,

        cover_image TEXT,

        tags TEXT,
        people TEXT,

        is_favorite INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,

        privacy TEXT,
        audio_note TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    );
`);
console.log("EchoLife database initialized successfully.");

module.exports = db;