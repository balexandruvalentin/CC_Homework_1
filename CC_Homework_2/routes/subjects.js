const express = require("express");
const router = express.Router();
const db = require("../databases/subjects_db");

// GET subject by ID
router.get("/:id", (req, res) => {
    res.setHeader("Cache-Control", "public, max-age=5");

    const subjectId = parseInt(req.params.id, 10);
    if (isNaN(subjectId)) return res.status(400).json({ error: "Invalid Subject ID" });

    db.get("SELECT * FROM Subjects WHERE ID = ?", [subjectId], (err, row) => {
        if (err) return res.status(500).json({ error: "Database Error" });
        if (!row) return res.status(404).json({ error: "Subject Not Found" });
        res.json(row);
    });
});

// GET subjects with optional queries
router.get("/", (req, res) => {
    res.setHeader("Cache-Control", "public, max-age=5");

    const { name, year, semester } = req.query;
    let query = "SELECT * FROM Subjects";
    let conditions = [];
    let params = [];

    if (name) {
        conditions.push("name LIKE ?");
        params.push(`%${name}%`);
    }
    if (year) {
        conditions.push("year = ?");
        params.push(year);
    }
    if (semester) {
        conditions.push("semester = ?");
        params.push(semester);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: "Database Error" });
        res.json(rows);
    });
});

// POST
router.post("", (req, res) => {
    res.setHeader("Cache-Control", "no-store");

    const { Name, Credits, Year, Semester, Description } = req.body;
    console.log({ Name, Credits, Year, Semester, Description });
    
    if (!Name || !Credits || !Year || !Semester) {
        return res.status(400).json({ error: "First four fields are required" });
    }

    db.run(
        "INSERT INTO Subjects (Name, Credits, Year, Semester, Description) VALUES (?, ?, ?, ?, ?)", 
        [Name, Credits, Year, Semester, Description],
        function (err) {
            if (err) return res.status(500).json({ error: "Database Insert Error" });
            res.status(201).json({ id: this.lastID });
        }
    );
});

// POST on specific
router.post("/:query?", (req, res) => {
    res.status(405).json({ error: "Method Not Allowed" });
});

// PUT
router.put("/:id", (req, res) => {
    res.setHeader("Cache-Control", "no-store");

    const subjectId = parseInt(req.params.id, 10);
    if (isNaN(subjectId)) return res.status(400).json({ error: "Invalid Subject ID" });

    const { Name, Credits, Year, Semester, Description } = req.body;
    db.run(
        "UPDATE Subjects SET Name = ?, Credits = ?, Year = ?, Semester = ?, Description = ? WHERE ID = ?",
        [Name, Credits, Year, Semester, Description, subjectId],
        function (err) {
            if (err) return res.status(500).json({ error: "Database Update Error" });
            if (this.changes === 0) return res.status(404).json({ error: "Subject Not Found" });
            res.json({ message: "Updated" });
        }
    );
});

// PUT on all subjects
router.put("", (req, res) => {
    res.status(405).json({ error: "Method Not Allowed" });
});

// DELETE
router.delete("/:id", (req, res) => {
    res.setHeader("Cache-Control", "no-store");

    const subjectId = parseInt(req.params.id, 10);
    if (isNaN(subjectId)) return res.status(400).json({ error: "Invalid Subject ID" });

    db.run("DELETE FROM Subjects WHERE ID = ?", [subjectId], function (err) {
        if (err) return res.status(500).json({ error: "Database Delete Error" });
        if (this.changes === 0) return res.status(404).json({ error: "Subject Not Found" });
        res.json({ message: "Deleted" });
    });
});

// DELETE on all subjects
router.delete("", (req, res) => {
    res.status(405).json({ error: "Method Not Allowed" });
});

module.exports = router;
