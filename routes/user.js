const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const router = express.Router();

// Pastikan folder uploads ada
if (!fs.existsSync('./uploads/cv')) {
  fs.mkdirSync('./uploads/cv', { recursive: true });
}
if (!fs.existsSync('./uploads/photos')) {
  fs.mkdirSync('./uploads/photos', { recursive: true });
}

// Konfigurasi Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'cvFile') {
      cb(null, 'uploads/cv/');
    } else if (file.fieldname === 'photoFile') {
      cb(null, 'uploads/photos/');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'cvFile') {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Hanya file PDF, DOC, atau DOCX yang diperbolehkan untuk CV!'));
    }
  } else if (file.fieldname === 'photoFile') {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Hanya file JPG atau PNG yang diperbolehkan untuk foto!'));
    }
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

// Helper functions untuk database
const UserProfile = {
  create: async (userData) => {
    const sql = `INSERT INTO user_profiles (nama_lengkap, tanggal_lahir, jenis_kelamin, alamat, email, no_telepon, pendidikan_terakhir, keahlian, kategori_pekerjaan, pengalaman_kerja, linkedin_url, instagram_url, cv_file, photo_file) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [userData.namaLengkap, userData.tanggalLahir, userData.jenisKelamin, userData.alamat, userData.email, userData.noTelepon, userData.pendidikanTerakhir, userData.keahlian, userData.kategoriPekerjaan, userData.pengalamanKerja, userData.linkedinUrl || null, userData.instagramUrl || null, userData.cvFile || null, userData.photoFile || null];
    const [result] = await db.execute(sql, values);
    return result;
  },
  findAll: async () => {
    const [rows] = await db.execute('SELECT * FROM user_profiles ORDER BY created_at DESC');
    return rows;
  },
  findById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM user_profiles WHERE id = ?', [id]);
    return rows[0];
  },
  findByEmail: async (email) => {
    const [rows] = await db.execute('SELECT * FROM user_profiles WHERE email = ?', [email]);
    return rows[0];
  },
  update: async (id, userData) => {
    const sql = `UPDATE user_profiles SET nama_lengkap = ?, tanggal_lahir = ?, jenis_kelamin = ?, alamat = ?, email = ?, no_telepon = ?, pendidikan_terakhir = ?, keahlian = ?, kategori_pekerjaan = ?, pengalaman_kerja = ?, linkedin_url = ?, instagram_url = ?, cv_file = ?, photo_file = ? WHERE id = ?`;
    const values = [userData.namaLengkap, userData.tanggalLahir, userData.jenisKelamin, userData.alamat, userData.email, userData.noTelepon, userData.pendidikanTerakhir, userData.keahlian, userData.kategoriPekerjaan, userData.pengalamanKerja, userData.linkedinUrl || null, userData.instagramUrl || null, userData.cvFile || null, userData.photoFile || null, id];
    const [result] = await db.execute(sql, values);
    return result;
  },
  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM user_profiles WHERE id = ?', [id]);
    return result;
  }
};

// ROUTES

// Health check
router.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ success: true, message: 'Server dan database berjalan dengan baik' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const profiles = await UserProfile.findAll();
    res.json({ success: true, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data', error: error.message });
  }
});

// Create user
router.post('/lengkapi-data', upload.fields([{ name: 'cvFile', maxCount: 1 }, { name: 'photoFile', maxCount: 1 }]), async (req, res) => {
  try {
    const profileData = { ...req.body };
    if (req.files) {
      if (req.files.cvFile) profileData.cvFile = req.files.cvFile[0].path;
      if (req.files.photoFile) profileData.photoFile = req.files.photoFile[0].path;
    }
    const result = await UserProfile.create(profileData);
    res.status(201).json({ success: true, message: 'Data berhasil disimpan!', data: { id: result.insertId } });
  } catch (error) {
    if (req.files) {
      if (req.files.cvFile) fs.unlinkSync(req.files.cvFile[0].path);
      if (req.files.photoFile) fs.unlinkSync(req.files.photoFile[0].path);
    }
    res.status(400).json({ success: false, message: error.code === 'ER_DUP_ENTRY' ? 'Email sudah terdaftar!' : 'Gagal menyimpan data', error: error.message });
  }
});

// Get by ID
router.get('/:id', async (req, res) => {
  try {
    const profile = await UserProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data', error: error.message });
  }
});

// Get by email
router.get('/email/:email', async (req, res) => {
  try {
    const profile = await UserProfile.findByEmail(req.params.email);
    if (!profile) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data', error: error.message });
  }
});

// Update
router.put('/:id', upload.fields([{ name: 'cvFile', maxCount: 1 }, { name: 'photoFile', maxCount: 1 }]), async (req, res) => {
  try {
    const existing = await UserProfile.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    
    const updateData = { ...req.body, cvFile: existing.cv_file, photoFile: existing.photo_file };
    if (req.files) {
      if (req.files.cvFile) {
        if (existing.cv_file && fs.existsSync(existing.cv_file)) fs.unlinkSync(existing.cv_file);
        updateData.cvFile = req.files.cvFile[0].path;
      }
      if (req.files.photoFile) {
        if (existing.photo_file && fs.existsSync(existing.photo_file)) fs.unlinkSync(existing.photo_file);
        updateData.photoFile = req.files.photoFile[0].path;
      }
    }
    await UserProfile.update(req.params.id, updateData);
    res.json({ success: true, message: 'Data berhasil diupdate!' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Gagal mengupdate data', error: error.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const profile = await UserProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    
    if (profile.cv_file && fs.existsSync(profile.cv_file)) fs.unlinkSync(profile.cv_file);
    if (profile.photo_file && fs.existsSync(profile.photo_file)) fs.unlinkSync(profile.photo_file);
    
    await UserProfile.delete(req.params.id);
    res.json({ success: true, message: 'Data berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menghapus data', error: error.message });
  }
});

module.exports = router;