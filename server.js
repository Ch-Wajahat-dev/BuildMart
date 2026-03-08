require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const { connectDB } = require("./database/db");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "ironcraft_session_secret",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 days
}));

// ── Request logger (debug) ────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith("/api/auth")) {
    console.log(`[${req.method}] ${req.path} | Origin: ${req.headers.origin || "none"}`);
  }
  next();
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/products", require("./routes/products"));
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/cart",     require("./routes/cart"));
app.use("/api/orders",   require("./routes/orders"));
app.use("/api/admin",    require("./routes/admin"));

// ── Static files (after API routes so they never intercept API calls) ─────────
app.use(express.static(path.join(__dirname)));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "index.html"));
  } else {
    res.status(404).json({ error: "API route not found" });
  }
});

// ── Connect to MongoDB, then start server ─────────────────────────────────────
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\nIronCraft Hardware Server running at http://localhost:${PORT}`);
      console.log(`  Admin dashboard: http://localhost:${PORT}/admin.html`);
      console.log(`  API base:        http://localhost:${PORT}/api\n`);
    });
  })
  .catch(err => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
