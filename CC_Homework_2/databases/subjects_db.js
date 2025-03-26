require("dotenv").config();
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(process.env.DATABASE_SUBJECTS, (err) => {
    if (err) console.error("Database connection error:", err.message);
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS Subjects (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Name TEXT NOT NULL, 
            Credits INTEGER NOT NULL,
            Year INTEGER NOT NULL,
            Semester INTEGER NOT NULL,
            Description TEXT 
        )
    `);
});

module.exports = db;
