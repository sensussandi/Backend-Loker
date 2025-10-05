import express from "express";
import cors from "cors";
import mysql from "mysql2";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Koneksi MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "getjob_db",
});

// 📂 Konfigurasi upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));

// ✅ LOGIN Mahasiswa
app.post("/api/loginMhs", (req, res) => {
  const { nim, password } = req.body;

  if (!nim || !password) {
    return res.status(400).json({ success: false, message: "NIM dan Password wajib diisi!" });
  }

  const query = "SELECT * FROM mahasiswa WHERE nim = ? AND password = ?";
  db.query(query, [nim, password], (err, results) => {
    if (err) {
      console.error("Error login:", err);
      return res.status(500).json({ success: false, message: "Kesalahan server." });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: "NIM atau Password salah!" });
    }

    const mahasiswa = results[0];
    res.json({ success: true, data: mahasiswa });
  });
});

// ✅ GET Mahasiswa by Email
app.get("/api/users/email/:email", (req, res) => {
  const { email } = req.params;
  const query = "SELECT * FROM mahasiswa WHERE email = ?";
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({ success: false, message: "Kesalahan server." });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Mahasiswa tidak ditemukan." });
    }
    res.json({ success: true, data: results[0] });
  });
});

// ✅ UPDATE / INSERT Data Mahasiswa
app.post(
  "/api/users/lengkapi-data",
  upload.fields([
    { name: "cvFile", maxCount: 1 },
    { name: "photoFile", maxCount: 1 },
  ]),
  (req, res) => {
    const data = req.body;
    const cvFile = req.files?.cvFile ? req.files.cvFile[0].path : null;
    const photoFile = req.files?.photoFile ? req.files.photoFile[0].path : null;

    const sql = `
      UPDATE mahasiswa SET 
        nama_lengkap=?, tanggal_lahir=?, jenis_kelamin=?, alamat=?, no_telepon=?,
        pendidikan_terakhir=?, keahlian=?, kategori_pekerjaan=?, pengalaman_kerja=?,
        linkedin_url=?, instagram_url=?, cv_file=IFNULL(?, cv_file), photo_file=IFNULL(?, photo_file)
      WHERE email=?`;

    const values = [
      data.namaLengkap, data.tanggalLahir, data.jenisKelamin, data.alamat, data.noTelepon,
      data.pendidikanTerakhir, data.keahlian, data.kategoriPekerjaan, data.pengalamanKerja,
      data.linkedinUrl, data.instagramUrl, cvFile, photoFile, data.email,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error update:", err);
        return res.status(500).json({ message: "Gagal menyimpan data ke database." });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Mahasiswa tidak ditemukan." });
      }

      res.json({ success: true, message: "Data berhasil diperbarui." });
    });
  }
);

// ✅ Jalankan Server
app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));
