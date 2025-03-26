require("dotenv").config();
const sqlite3 = require("sqlite3").verbose();
const crypto = require('crypto');

const db = new sqlite3.Database(process.env.DATABASE_USERS, (err) => {
    if (err) console.error("Database connection error:", err.message);
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS Users (
            UID INTEGER PRIMARY KEY AUTOINCREMENT,
            Name TEXT NOT NULL,
            Password TEXT NOT NULL,
            Salt TEXT NOT NULL
        )
    `);
});

const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt };
};

const verifyPassword = (enteredPassword, storedHash, storedSalt) => {
    const hash = crypto.pbkdf2Sync(enteredPassword, storedSalt, 10000, 64, 'sha512').toString('hex');
    
    if (hash === storedHash) {
        return true;
    } else {
        return false;    
    }
};

const addUser = async (name, password) => {
    try {
        const { hash, salt } = hashPassword(password);
        db.run(
            "INSERT INTO Users (Name, Password, Salt) VALUES (?, ?, ?)", 
            [name, hash, salt],
            function (err) {
                if (err) {
                    console.error("Error inserting user:", err.message);
                } else {
                    console.log(`User ${name} added with UID ${this.lastID}`);
                }
            }
        );
    } catch (error) {
        console.error("Hashing error:", error);
    }
};

async function findUserByName(name) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE name = ?', [name], (err, row) => {
            if (err) {
                console.error("Database error:", err);
                reject(err);
            } else {
                console.log("User found:", row);
                resolve(row);
            }
        });
    });
}

const verifyUser = async (name, password, callback) => {
    try {
        const user = await findUserByName(name);

        if (!user) {
            return callback(null, null);
        }

        const { Password: storedHash, Salt: storedSalt } = user;

        if (storedHash === storedHash) {
            console.log("Password match successful!");
            return callback(null, user);
        } else {
            console.log("Password does not match.");
            return callback(null, null);
        }
    } catch (err) {
        console.error("Error during password verification:", err);
        callback(err, null);
    }
};

module.exports = { db, addUser, verifyUser, findUserByName };
