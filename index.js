const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Koneksi ke MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",     // default user XAMPP
  password: "",     // default password kosong
  database: "getjob"
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error connect MySQL:", err);
    return;
  }
  console.log("✅ Connected to MySQL database");
});

// Tambahkan route ini biar nggak "Cannot GET /"
app.get("/", (req, res) => {
  res.send("Backend API Express + MySQL jalan ✅");
});

// API CRUD
app.get("/api/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

app.post("/api/users", (req, res) => {
  const { name, email } = req.body;
  db.query("INSERT INTO users (name, email) VALUES (?, ?)", [name, email], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ id: result.insertId, name, email });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
