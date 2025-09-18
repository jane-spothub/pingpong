import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import progressRoutes from "./routes/progress.js";

const app = express();

// Helpers to replace __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json()); // <-- important for req.body
app.use(express.static(path.join(__dirname, "public")));

// set ejs as template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// routes
app.get("/", (req, res) => {
    res.render("home");
});

app.get("/bot", (req, res) => {
    res.render("bot");
});

// Progress API
app.use("/api", progressRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
