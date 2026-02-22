const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

// ===== Config =====
const ALLOWED_ORIGINS = new Set([
  "https://map.mufticraft.store",
  "https://mufticraft.store",
]);

const CLAIMS_API_TOKEN = process.env.CLAIMS_API_TOKEN || "";
const JWT_SECRET = process.env.JWT_SECRET || "";

// Fail fast if secrets are missing (saves you hours)
if (!CLAIMS_API_TOKEN) {
  console.error("❌ Missing env var: CLAIMS_API_TOKEN");
}
if (!JWT_SECRET) {
  console.error("❌ Missing env var: JWT_SECRET");
}

// Where to store user accounts (simple JSON DB for now)
const DATA_DIR = "/opt/mufticraft-claims/data";
const USERS_FILE = path.join(DATA_DIR, "users.json");

// If you're behind nginx/cloudflare, this helps req.ip be correct
app.set("trust proxy", true);

// ===== Middleware =====
app.use(express.json({ limit: "1mb" }));

// CORS (safe + predictable)
// - allow curl (no Origin header)
// - allow only your sites (Origin present)
// app.use(
//   cors({
//     origin: (origin, cb) => {
//       if (!origin) return cb(null, true);
//       return cb(null, ALLOWED_ORIGINS.has(origin));
//     },
//     credentials: false,
//     methods: ["GET", "POST", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     maxAge: 86400,
//   })
// );


// ===== Helpers =====
function ensureUsersFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]", "utf8");
}

function readUsers() {
  ensureUsersFile();
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function writeUsers(users) {
  ensureUsersFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

function makeJwt(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, uuid: user.uuid, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function requireJwt(req, res, next) {
  const auth = req.headers.authorization || "";
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return res.status(401).json({ error: "missing token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}

// ===== Health check =====
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// ===== Claims endpoint (token protected; nginx can inject token) =====
app.post("/api/claims", (req, res) => {
  const auth = req.headers.authorization || "";
  if (!CLAIMS_API_TOKEN || auth !== `Bearer ${CLAIMS_API_TOKEN}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const payload = req.body;
  if (!payload || !payload.world || !Array.isArray(payload.vertices)) {
    return res.status(400).json({ error: "invalid payload" });
  }

  const inboxDir = "/opt/minecraft/claims/inbox";
  fs.mkdirSync(inboxDir, { recursive: true });

  const fname = `claim_${Date.now()}_${Math.random().toString(16).slice(2)}.json`;
  fs.writeFileSync(path.join(inboxDir, fname), JSON.stringify(payload, null, 2), "utf8");

  res.json({ ok: true, saved: fname });
});

// ===== Register =====
app.post("/api/register", async (req, res) => {
  const { username, password, uuid } = req.body || {};

  if (!username || typeof username !== "string" || username.length < 3) {
    return res.status(400).json({ error: "username must be at least 3 chars" });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "password must be at least 8 chars" });
  }
  if (uuid && (typeof uuid !== "string" || uuid.length < 10)) {
    return res.status(400).json({ error: "invalid uuid" });
  }

  const users = readUsers();
  const uname = username.toLowerCase();

  if (users.some((u) => u.username.toLowerCase() === uname)) {
    return res.status(409).json({ error: "username already exists" });
  }
  if (uuid && users.some((u) => u.uuid && u.uuid === uuid)) {
    return res.status(409).json({ error: "uuid already registered" });
  }

  const hash = await bcrypt.hash(password, 12);
  const user = {
    id: `u_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    username,
    uuid: uuid || null,
    role: "player",
    password_hash: hash,
    created_at: new Date().toISOString(),
  };

  users.push(user);
  writeUsers(users);

  const token = makeJwt(user);
  res.status(201).json({
    ok: true,
    token,
    user: { id: user.id, username: user.username, uuid: user.uuid, role: user.role },
  });
});

// ===== Login =====
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "missing credentials" });

  const users = readUsers();
  const user = users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user) return res.status(401).json({ error: "invalid username or password" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid username or password" });

  const token = makeJwt(user);
  res.json({
    ok: true,
    token,
    user: { id: user.id, username: user.username, uuid: user.uuid, role: user.role },
  });
});

// ===== Me =====
app.get("/api/me", requireJwt, (req, res) => {
  res.json({ ok: true, me: req.user });
});

app.listen(5055, "127.0.0.1", () => {
  console.log("Claims API listening on http://127.0.0.1:5055");
});
