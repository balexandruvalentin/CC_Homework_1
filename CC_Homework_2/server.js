require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const weatherRoutes = require("./routes/weather");
const randomRoutes = require("./routes/random");
const customRoutes = require("./routes/subjects");
const { authRoutes, authenticateToken } = require("./routes/auth");

const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 19000;

app.use(bodyParser.json());

app.use("/api/weather", weatherRoutes);
app.use("/api/random", randomRoutes);
app.use("/api/auth", authRoutes);

app.use("/api/subjects", authenticateToken, customRoutes);

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/`));
process.on("SIGINT", () => {
    console.log("Server closed");
    process.exit(0);
});