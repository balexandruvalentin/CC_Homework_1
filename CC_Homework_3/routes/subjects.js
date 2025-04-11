const express = require("express");
const router = express.Router();
const multer = require("multer");
const { getSubjectById, getSubjectByName, getSubjects, addSubject, updateSubject, deleteSubject } = require("../services/firestore");
const { uploadBuffer, deleteFile } = require("../services/storage");

const bucketName = 'subject-manager-bucket';

const upload = multer();
const DEFAULT_IMAGE_URL = "https://storage.googleapis.com/subject-manager-bucket/subjects/default.JPEG";

const setCache = (res, mode = "public", maxAge = 5) => {
    res.setHeader("Cache-Control", `${mode}, max-age=${maxAge}`);
};

// GET subject by ID
router.get("/:id", async (req, res) => {
    setCache(res);
    const subject = await getSubjectById(req.params.id);
    if (!subject) return res.status(404).json({ error: "Subject Not Found" });

    res.json({ ID: subject.id, ...subject });
});

// GET subjects with optional queries
router.get("/", async (req, res) => {
    setCache(res);
    const subjects = await getSubjects(req.query);

    const subjectsWithIds = subjects.map(subject => ({
        ID: subject.id,
        ...subject
    }));

    res.json(subjectsWithIds);
});

// POST
router.post("/", upload.single("image"), async (req, res) => {
    setCache(res, "no-store");

    const { Name, Credits, Year, Semester, Description } = req.body;
    if (!Name || !Credits || !Year || !Semester) {
        return res.status(400).json({ error: "First four fields are required" });
    }

    let imageUrl = DEFAULT_IMAGE_URL;

    if (req.file) {
        try {
            imageUrl = await uploadBuffer(req.file.buffer, req.file.originalname);
        } catch (err) {
            return res.status(500).json({ error: "Image upload failed" });
        }
    }
    try {
        const id = await addSubject({
            Name,
            Credits: parseInt(Credits),
            Year: parseInt(Year),
            Semester: parseInt(Semester),
            Description,
            imageUrl,
            createdAt: new Date(),
        });
        res.status(201).json({ id });
    } catch(error) {
        res.status(409).json({ error: "Subject with this name already exists"})
    }
});

// PUT
router.put("/:id", upload.single("image"), async (req, res) => {
    setCache(res, "no-store");

    const id = req.params.id;
    const { Name, Credits, Year, Semester, Description } = req.body;
    if (!Name || !Credits || !Year || !Semester) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await getSubjectById(id);
    if (!existing) return res.status(404).json({ error: "Subject Not Found" });

    let imageUrl = existing.imageUrl || DEFAULT_IMAGE_URL;

    // if new image uploaded, replace old one
    if (req.file) {
        try {
            imageUrl = await uploadBuffer(req.file.buffer, req.file.originalname);
            if (existing.imageUrl && existing.imageUrl !== DEFAULT_IMAGE_URL) {
                const url = new URL(existing.imageUrl);
                const filePath = url.pathname.split(`/${bucketName}/`)[1];
                await deleteFile(filePath);
            }
        } catch (err) {
            return res.status(500).json({ error: "Image upload failed" });
        }
    }

    const updated = await updateSubject(id, {
        Name,
        Credits: parseInt(Credits),
        Year: parseInt(Year),
        Semester: parseInt(Semester),
        Description,
        imageUrl,
        updatedAt: new Date(),
    });

    res.json({ message: "Updated", id });
});

router.put("/name/:name", upload.single("image"), async (req, res) => {
    setCache(res, "no-store");

    const { name } = req.params;
    const { Name, Credits, Year, Semester, Description } = req.body;
    if (!Name || !Credits || !Year || !Semester) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await getSubjectByName(name);
    if (!existing) return res.status(404).json({ error: "Subject Not Found" });

    let imageUrl = existing.imageUrl || DEFAULT_IMAGE_URL;

    if (req.file) {
        try {
            imageUrl = await uploadBuffer(req.file.buffer, req.file.originalname);
            if (existing.imageUrl && existing.imageUrl !== DEFAULT_IMAGE_URL) {
                const url = new URL(existing.imageUrl);
                const filePath = url.pathname.split(`/${bucketName}/`)[1];
                await deleteFile(filePath);
            }
        } catch (err) {
            return res.status(500).json({ error: "Image upload failed" });
        }
    }

    await updateSubject(existing.id, {
        Name,
        Credits: parseInt(Credits),
        Year: parseInt(Year),
        Semester: parseInt(Semester),
        Description,
        imageUrl,
        updatedAt: new Date(),
    });

    res.json({ message: "Updated", id: existing.id });
});


// DELETE
router.delete("/:id", async (req, res) => {
    setCache(res, "no-store");

    const existing = await getSubjectById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Subject Not Found" });

    if (existing.imageUrl && existing.imageUrl !== DEFAULT_IMAGE_URL) {
        try {
                const url = new URL(existing.imageUrl);
                const filePath = url.pathname.split(`/${bucketName}/`)[1];
            await deleteFile(filePath);
        } catch (err) {
            console.warn("Image delete failed (ignored):", err.message);
        }
    }

    await deleteSubject(req.params.id);
    res.json({ message: "Deleted" });
});

router.delete("/name/:name", async (req, res) => {
    setCache(res, "no-store");

    const existing = await getSubjectByName(req.params.name);
    if (!existing) return res.status(404).json({ error: "Subject Not Found" });

    if (existing.imageUrl && existing.imageUrl !== DEFAULT_IMAGE_URL) {
        try {
            const url = new URL(existing.imageUrl);
            const filePath = url.pathname.split(`/${bucketName}/`)[1];
            await deleteFile(filePath);
        } catch (err) {
            console.warn("Image delete failed (ignored):", err.message);
        }
    }

    await deleteSubject(existing.id);
    res.json({ message: "Deleted" });
});

module.exports = router;