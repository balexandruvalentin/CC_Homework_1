require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const route = require("./routes/subjects");

const path = require("path");

const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT;

app.use(bodyParser.json());

app.use("/api/subjects", route);

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/`));
process.on("SIGINT", () => {
    console.log("Server closed");
    process.exit(0);
});