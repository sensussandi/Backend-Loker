// express-backend/models/user.js
const db = require('../db'); // Sesuaikan path jika Anda menaruh db.js di models/

const UserModel = {
    /**
     * Menyimpan data pengguna baru ke database.
     * @param {Object} userData - Data dari form termasuk path file.
     * @returns {Promise<number>} ID pengguna yang baru saja dibuat.
     */
    saveUserData: async (userData) => {
        const sql = `
            INSERT INTO users (
                nama_lengkap, tanggal_lahir, jenis_kelamin, alamat, email, no_telepon,
                pendidikan_terakhir, keahlian, kategori_pekerjaan, pengalaman_kerja,
                linkedin_url, instagram_url, cv_file_path, photo_file_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            userData.namaLengkap,
            userData.tanggalLahir,
            userData.jenisKelamin,
            userData.alamat,
            userData.email,
            userData.noTelepon,
            userData.pendidikanTerakhir,
            userData.keahlian,
            userData.kategoriPekerjaan,
            userData.pengalamanKerja,
            userData.linkedinUrl || null,
            userData.instagramUrl || null,
            userData.cvFilePath,
            userData.photoFilePath,
        ];

        const [result] = await db.execute(sql, values);
        return result.insertId;
    }
};

module.exports = UserModel;