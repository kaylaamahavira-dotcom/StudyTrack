// db.js — Koneksi MySQL Pool & Otomatisasi Inisialisasi Database + Seed Data
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306', 10),
};

const DB_NAME = process.env.DB_NAME || 'studytrack_db';

let pool = null;

async function initDB() {
  // 1. Buat database jika belum ada
  const tempConn = await mysql.createConnection(dbConfig);
  await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await tempConn.end();

  // 2. Buat Connection Pool ke database studytrack_db
  pool = mysql.createPool({
    ...dbConfig,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true // Menjaga format tanggal YYYY-MM-DD
  });

  // 3. Buat tabel-tabel jika belum ada
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL UNIQUE,
      phone VARCHAR(30) NOT NULL DEFAULT '',
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
      avatar MEDIUMTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      course VARCHAR(100) NOT NULL DEFAULT '',
      date DATE NOT NULL,
      prio ENUM('Tinggi', 'Sedang', 'Rendah') NOT NULL DEFAULT 'Sedang',
      notes TEXT NULL,
      done TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      min INT NOT NULL DEFAULT 0,
      done TINYINT(1) NOT NULL DEFAULT 0,
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notif_settings (
      user_id INT PRIMARY KEY,
      email_enabled TINYINT(1) NOT NULL DEFAULT 1,
      wa_enabled TINYINT(1) NOT NULL DEFAULT 0,
      to_email VARCHAR(100) NOT NULL DEFAULT '',
      to_phone VARCHAR(30) NOT NULL DEFAULT '',
      reminder_days VARCHAR(50) NOT NULL DEFAULT '7,3,1',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      task_id INT NULL,
      to_email VARCHAR(100) NOT NULL,
      task_name VARCHAR(255) NOT NULL,
      h_days INT NOT NULL,
      scheduled_date DATE NOT NULL,
      status ENUM('Tertunda', 'Berhasil', 'Gagal', 'Tidak Terkirim') NOT NULL DEFAULT 'Tertunda',
      note VARCHAR(255) NOT NULL DEFAULT '',
      sent_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wa_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      task_id INT NULL,
      to_phone VARCHAR(30) NOT NULL,
      task_name VARCHAR(255) NOT NULL,
      h_days INT NOT NULL,
      scheduled_date DATE NOT NULL,
      status ENUM('Tertunda', 'Berhasil', 'Gagal', 'Tidak Terkirim') NOT NULL DEFAULT 'Tertunda',
      note VARCHAR(255) NOT NULL DEFAULT '',
      sent_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token VARCHAR(100) PRIMARY KEY,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // 4. Seed user demo jika tabel users kosong
  const [users] = await pool.query('SELECT COUNT(*) AS c FROM users');
  if (users[0].c === 0) {
    const addDays = (n) => {
      const d = new Date();
      d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    };

    // Buat akun admin
    const [adminRes] = await pool.query(`
      INSERT INTO users (username, email, phone, password, role)
      VALUES (?, ?, ?, ?, 'admin')
    `, ['admin', 'admin@studytrack.id', '', bcrypt.hashSync('admin123', 10)]);

    await pool.query(`
      INSERT INTO notif_settings (user_id, email_enabled, wa_enabled, to_email, reminder_days)
      VALUES (?, 0, 0, 'admin@studytrack.id', '7,3,1')
    `, [adminRes.insertId]);

    // Buat akun mahasiswa
    const [userRes] = await pool.query(`
      INSERT INTO users (username, email, phone, password, role)
      VALUES (?, ?, ?, ?, 'user')
    `, ['satrio', 'satrio@student.ac.id', '', bcrypt.hashSync('test', 10)]);

    await pool.query(`
      INSERT INTO notif_settings (user_id, email_enabled, wa_enabled, to_email, reminder_days)
      VALUES (?, 1, 1, 'satrio@student.ac.id', '7,3,1')
    `, [userRes.insertId]);

    const [mhsRes] = await pool.query(`
      INSERT INTO users (username, email, phone, password, role)
      VALUES (?, ?, ?, ?, 'user')
    `, ['Mahasiswa', 'Mahasiswa@student.ac.id', '', bcrypt.hashSync('123456', 10)]);

    const userId = mhsRes.insertId;

    await pool.query(`
      INSERT INTO notif_settings (user_id, email_enabled, wa_enabled, to_email, reminder_days)
      VALUES (?, 1, 1, 'Mahasiswa@student.ac.id', '7,3,1')
    `, [userId]);

    const seeds = [
      { name: 'Menyusun dokumen SRS', days: 1, prio: 'Tinggi', done: 0 },
      { name: 'Membuat ERD', days: 3, prio: 'Sedang', done: 0 },
      { name: 'Membuat wireframe', days: 7, prio: 'Sedang', done: 0 },
      { name: 'Melakukan konfigurasi jaringan', days: 2, prio: 'Tinggi', done: 0 },
      { name: 'Membuat Diagram UML', days: -1, prio: 'Sedang', done: 1 },
    ];

    for (const s of seeds) {
      await pool.query(`
        INSERT INTO tasks (user_id, name, date, prio, done)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, s.name, addDays(s.days), s.prio, s.done]);
    }

    console.log('✅ MySQL Database & tabel berhasil diinisialisasi beserta data demo.');
  }

  return pool;
}

module.exports = {
  initDB,
  getPool: () => pool,
  query: async (...args) => {
    if (!pool) await initDB();
    return pool.query(...args);
  }
};
