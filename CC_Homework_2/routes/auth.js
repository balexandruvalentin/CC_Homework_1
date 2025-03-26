const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { addUser, verifyUser, findUserByName } = require("../databases/users_db");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

router.use(express.json());

router.post("/signup", async (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ error: "Name and password are required" });
    }

    try {
        const existingUser = await findUserByName(name);
        if (existingUser) {
            return res.status(400).json({ error: "Username is already taken" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
 
        await addUser(name, hashedPassword);
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error registering user" });
    }
});

router.post("/login", (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ error: "Name and password are required" });
    }

    verifyUser(name, password, async (err, user) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ uid: user.UID, name: user.Name }, SECRET_KEY, { expiresIn: "1h" });
        res.json({ message: "Login successful", token });
    });
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid token" });

        req.user = decoded;
        next();
    });
};

module.exports = { authRoutes: router, authenticateToken };
