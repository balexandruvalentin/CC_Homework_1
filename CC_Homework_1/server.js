const http = require("http");
const db = require("./database");

const PORT = 19000;

const requestHandler = (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const url = new URL(req.url, `http://${req.headers.host}`);

    // GET
    if (req.method === "GET" && url.pathname === "/subjects") {
        res.setHeader("Cache-Control", "public, max-age=3600");

        db.all("SELECT * FROM Subjects", (err, rows) => {
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: "Database Error" }));
            } else {
                res.writeHead(200);
                res.end(JSON.stringify(rows));
            }
        });
    } 
    else if (req.method === "GET" && url.pathname.startsWith("/subjects/")) {
        res.setHeader("Cache-Control", "public, max-age=3600");

        const subjectId = parseInt(url.pathname.replace("/subjects/", ""), 10);
        if (isNaN(subjectId)) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Invalid Subject ID" }));
            return;
        }
        
        db.get("SELECT * FROM Subjects WHERE ID = ?", [subjectId], (err, row) => {
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: "Database Error" }));
            } else if (row) {
                res.writeHead(200);
                res.end(JSON.stringify(row));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: "Subject Not Found" }));
            }
        });
    } 

    // POST
    else if (req.method === "POST" && url.pathname === "/subjects") {
        res.setHeader("Cache-Control", "no-store");

        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try {
                const { Name, Credits, Year, Semester, Description } = JSON.parse(body);
                db.run(
                    "INSERT INTO Subjects (Name, Credits, Year, Semester, Description) VALUES (?, ?, ?, ?, ?)", 
                    [Name, Credits, Year, Semester, Description],
                    function (err) {
                        if (err) {
                            res.writeHead(500);
                            res.end(JSON.stringify({ error: "Database Insert Error" }));
                        } else {
                            res.writeHead(201);
                            res.end(JSON.stringify({ id: this.lastID }));
                        }
                    }
                );
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: "Invalid JSON format" }));
            }
        });
    }
    else if (req.method === "POST" && url.pathname.startsWith("/subjects/")) {
        res.writeHead(405);
        res.end(JSON.stringify({ error: "Method Not Allowed" }));
    }

    // PUT
    else if (req.method === "PUT" && url.pathname === "/subjects") {
        res.writeHead(405);
        res.end(JSON.stringify({ error: "Method Not Allowed" }));
    }
    else if (req.method === "PUT" && url.pathname.startsWith("/subjects/")) {
        res.setHeader("Cache-Control", "no-store");

        const subjectId = parseInt(url.pathname.replace("/subjects/", ""), 10);
        if (isNaN(subjectId)) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Invalid Subject ID" }));
            return;
        }
        
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try {
                const { Name, Credits, Year, Semester, Description } = JSON.parse(body);
                db.run(
                    "UPDATE Subjects SET Name = ?, Credits = ?, Year = ?, Semester = ?, Description = ? WHERE ID = ?",
                    [Name, Credits, Year, Semester, Description, subjectId],
                    function (err) {
                        if (err) {
                            res.writeHead(500);
                            res.end(JSON.stringify({ error: "Database Update Error" }));
                        } else if (this.changes === 0) {
                            res.writeHead(404);
                            res.end(JSON.stringify({ error: "Subject Not Found" }));
                        } else {
                            res.writeHead(200);
                            res.end(JSON.stringify({ message: "Updated" }));
                        }
                    }
                );
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: "Invalid JSON format" }));
            }
        });
    }

    // DELETE
    else if (req.method === "DELETE" && url.pathname === "/subjects") {
        res.writeHead(405);
        res.end(JSON.stringify({ error: "Method Not Allowed" }));
    }
    else if (req.method === "DELETE" && url.pathname.startsWith("/subjects/")) {
        res.setHeader("Cache-Control", "no-store");

        const subjectId = parseInt(url.pathname.replace("/subjects/", ""), 10);
        if (isNaN(subjectId)) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Invalid Subject ID" }));
            return;
        }
        
        db.run("DELETE FROM Subjects WHERE ID = ?", [subjectId], function (err) {
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: "Database Delete Error" }));
            } else if (this.changes === 0) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: "Subject Not Found" }));
            } else {
                res.writeHead(200);
                res.end(JSON.stringify({ message: "Deleted" }));
            }
        });
    } 
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Route Not Found" }));
    }
};

const server = http.createServer(requestHandler);
server.listen(PORT, () => console.log("Server running at http://localhost:${PORT}/"));

process.on("SIGINT", () => {
    db.close(() => {
        console.log("Server closed!");
        process.exit(0);
    });
});
