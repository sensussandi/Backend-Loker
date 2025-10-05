// express-backend/db.js
const mysql = require('mysql2/promise');

// Konfigurasi connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Default XAMPP password kosong
  database: 'user_profile_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test koneksi dan buat database jika belum ada
async function initDatabase() {
  try {
    // Koneksi tanpa database untuk create database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });

    // Buat database jika belum ada
    await connection.query('CREATE DATABASE IF NOT EXISTS user_profile_db');
    console.log('✓ Database checked/created successfully');
    await connection.end();

    // Buat tabel
    await createTable();
    console.log('✓ MySQL Connected and Table Ready');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
}

// Buat tabel user_profiles
async function createTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS user_profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama_lengkap VARCHAR(255) NOT NULL,
      tanggal_lahir DATE NOT NULL,
      jenis_kelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
      alamat TEXT NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      no_telepon VARCHAR(20) NOT NULL,
      pendidikan_terakhir VARCHAR(255) NOT NULL,
      keahlian TEXT NOT NULL,
      kategori_pekerjaan VARCHAR(255) NOT NULL,
      pengalaman_kerja TEXT NOT NULL,
      linkedin_url VARCHAR(500) DEFAULT NULL,
      instagram_url VARCHAR(500) DEFAULT NULL,
      cv_file VARCHAR(500) DEFAULT NULL,
      photo_file VARCHAR(500) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  try {
    await pool.query(createTableQuery);
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
}

// Jalankan inisialisasi
initDatabase();

// Export pool untuk digunakan di routes
module.exports = pool;