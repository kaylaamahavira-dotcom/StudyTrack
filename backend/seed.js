// seed.js — Script untuk melakukan populasi data lengkap ke MySQL
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  dateStrings: true
};

const DB_NAME = process.env.DB_NAME || 'studytrack_db';

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

async function seed() {
  console.log('⏳ Menghubungkan ke MySQL...');
  
  // 1. Buat database jika belum ada
  const rootConn = await mysql.createConnection(dbConfig);
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await rootConn.end();

  const conn = await mysql.createConnection({ ...dbConfig, database: DB_NAME });
  console.log(`✅ Terhubung ke database: ${DB_NAME}`);

  // 2. Buat tabel jika belum ada
  console.log('📦 Memeriksa skema tabel...');
  await conn.query(`
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

  await conn.query(`
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

  await conn.query(`
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

  await conn.query(`
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

  await conn.query(`
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

  await conn.query(`
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

  await conn.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token VARCHAR(100) PRIMARY KEY,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // 3. Bersihkan data lama agar fresh
  console.log('🧹 Membersihkan data lama...');
  await conn.query('SET FOREIGN_KEY_CHECKS = 0;');
  await conn.query('TRUNCATE TABLE sessions;');
  await conn.query('TRUNCATE TABLE email_notifications;');
  await conn.query('TRUNCATE TABLE wa_notifications;');
  await conn.query('TRUNCATE TABLE notif_settings;');
  await conn.query('TRUNCATE TABLE plans;');
  await conn.query('TRUNCATE TABLE tasks;');
  await conn.query('TRUNCATE TABLE users;');
  await conn.query('SET FOREIGN_KEY_CHECKS = 1;');

  // 4. Populasi Tabel Pengguna (users)
  console.log('👤 Mengisi data pengguna...');
  const usersData = [
    {
      username: 'admin',
      email: 'admin@studytrack.id',
      phone: '081234567890',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin'
    },
    {
      username: 'Mahasiswa',
      email: 'Mahasiswa@student.ac.id',
      phone: '081298765432',
      password: bcrypt.hashSync('123456', 10),
      role: 'user'
    },
    {
      username: 'satrio',
      email: 'satrio.wibowo@student.ac.id',
      phone: '081345678901',
      password: bcrypt.hashSync('test', 10),
      role: 'user'
    },
    {
      username: 'nadia_putri',
      email: 'nadia.putri@student.ac.id',
      phone: '081567890123',
      password: bcrypt.hashSync('nadia123', 10),
      role: 'user'
    }
  ];

  const userIds = {};
  for (const u of usersData) {
    const [res] = await conn.query(`
      INSERT INTO users (username, email, phone, password, role)
      VALUES (?, ?, ?, ?, ?)
    `, [u.username, u.email, u.phone, u.password, u.role]);
    userIds[u.username] = res.insertId;
  }

  // 5. Populasi Pengaturan Notifikasi (notif_settings)
  console.log('⚙️ Mengisi pengaturan notifikasi...');
  for (const [username, uid] of Object.entries(userIds)) {
    const isUser = username !== 'admin';
    const email = usersData.find(x => x.username === username).email;
    const phone = usersData.find(x => x.username === username).phone;

    await conn.query(`
      INSERT INTO notif_settings (user_id, email_enabled, wa_enabled, to_email, to_phone, reminder_days)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [uid, isUser ? 1 : 0, isUser ? 1 : 0, email, phone, '7,3,1']);
  }

  // 6. Populasi Tugas Kuliah (tasks)
  console.log('📋 Mengisi daftar tugas kuliah...');
  const tasksData = [
    // Tugas untuk Mahasiswa
    { uid: userIds['Mahasiswa'], name: 'Menyusun dokumen SRS', course: 'Rekayasa Perangkat Lunak', days: 1, prio: 'Tinggi', done: 0, notes: 'Fokus Bab 2 & 3' },
    { uid: userIds['Mahasiswa'], name: 'Membuat ERD & Skema Relasi', course: 'Basis Data', days: 3, prio: 'Sedang', done: 0, notes: 'Gunakan MySQL Workbench' },
    { uid: userIds['Mahasiswa'], name: 'Desain Wireframe UI/UX', course: 'Interaksi Manusia & Komputer', days: 7, prio: 'Sedang', done: 0, notes: 'Selesai 10 halaman Figma' },
    { uid: userIds['Mahasiswa'], name: 'Konfigurasi Jaringan Routing OSPF', course: 'Jaringan Komputer', days: 2, prio: 'Tinggi', done: 0, notes: 'Praktikum Cisco Packet Tracer' },
    { uid: userIds['Mahasiswa'], name: 'Membuat Diagram UML Class & Sequence', course: 'PBO', days: -1, prio: 'Sedang', done: 1, notes: 'Sudah disetujui dosen' },
    { uid: userIds['Mahasiswa'], name: 'Review Paper Machine Learning', course: 'Kecerdasan Buatan', days: 5, prio: 'Rendah', done: 0, notes: 'Ringkasan max 3 halaman' },

    // Tugas untuk Satrio
    { uid: userIds['satrio'], name: 'Analisis Algoritma Dijkstra', course: 'Strategi Algoritma', days: 2, prio: 'Tinggi', done: 0, notes: 'Implementasi Python' },
    { uid: userIds['satrio'], name: 'Laporan Praktikum Sistem Operasi', course: 'Sistem Operasi', days: 4, prio: 'Sedang', done: 0, notes: 'Modul Shell Scripting' },
    { uid: userIds['satrio'], name: 'Presentasi Proyek Akhir', course: 'Kewirausahaan IT', days: 10, prio: 'Tinggi', done: 0, notes: 'Slide pitch deck' },

    // Tugas untuk Nadia
    { uid: userIds['nadia_putri'], name: 'Kuis Teori Graf & Kombinatorika', course: 'Matematika Diskrit', days: 1, prio: 'Tinggi', done: 0, notes: 'Bab 4 dan 5' },
    { uid: userIds['nadia_putri'], name: 'Membuat API CRUD RESTful', course: 'Pemrograman Web', days: 6, prio: 'Sedang', done: 0, notes: 'Express + MySQL' }
  ];

  const taskIds = [];
  for (const t of tasksData) {
    const [res] = await conn.query(`
      INSERT INTO tasks (user_id, name, course, date, prio, notes, done)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [t.uid, t.name, t.course, addDays(t.days), t.prio, t.notes, t.done]);
    taskIds.push({ id: res.insertId, ...t, date: addDays(t.days) });
  }

  // 7. Populasi Rencana Belajar Harian (plans)
  console.log('⏱️ Mengisi rencana belajar harian...');
  const plansData = [
    { uid: userIds['Mahasiswa'], name: 'Membaca Dokumentasi SRS', min: 45, done: 1, date: addDays(0) },
    { uid: userIds['Mahasiswa'], name: 'Latihan Normalisasi 3NF', min: 60, done: 0, date: addDays(0) },
    { uid: userIds['Mahasiswa'], name: 'Mengerjakan Prototyping Figma', min: 90, done: 0, date: addDays(0) },
    { uid: userIds['satrio'], name: 'Review Materi Algoritma Greedy', min: 30, done: 1, date: addDays(0) },
    { uid: userIds['satrio'], name: 'Debugging Program Shell Script', min: 60, done: 0, date: addDays(0) },
    { uid: userIds['nadia_putri'], name: 'Menghafal Teorema Graf Pohon', min: 45, done: 1, date: addDays(0) }
  ];

  for (const p of plansData) {
    await conn.query(`
      INSERT INTO plans (user_id, name, min, done, date)
      VALUES (?, ?, ?, ?, ?)
    `, [p.uid, p.name, p.min, p.done, p.date]);
  }

  // 8. Populasi Tabel Khusus Notifikasi Email (email_notifications)
  console.log('📧 Mengisi tabel khusus notifikasi Email...');
  const emailNotifs = [
    {
      user_id: userIds['Mahasiswa'],
      task_id: taskIds[0].id,
      to_email: 'Mahasiswa@student.ac.id',
      task_name: 'Menyusun dokumen SRS',
      h_days: 1,
      scheduled_date: addDays(0),
      status: 'Berhasil',
      note: 'Terkirim otomatis oleh cron',
      sent_at: `${addDays(0)} 07:00:00`
    },
    {
      user_id: userIds['Mahasiswa'],
      task_id: taskIds[1].id,
      to_email: 'Mahasiswa@student.ac.id',
      task_name: 'Membuat ERD & Skema Relasi',
      h_days: 3,
      scheduled_date: addDays(0),
      status: 'Berhasil',
      note: 'Terkirim ke email terdaftar',
      sent_at: `${addDays(0)} 07:00:00`
    },
    {
      user_id: userIds['Mahasiswa'],
      task_id: taskIds[2].id,
      to_email: 'Mahasiswa@student.ac.id',
      task_name: 'Desain Wireframe UI/UX',
      h_days: 7,
      scheduled_date: addDays(0),
      status: 'Berhasil',
      note: 'Terkirim',
      sent_at: `${addDays(0)} 07:00:00`
    },
    {
      user_id: userIds['Mahasiswa'],
      task_id: taskIds[3].id,
      to_email: 'Mahasiswa@student.ac.id',
      task_name: 'Konfigurasi Jaringan Routing OSPF',
      h_days: 1,
      scheduled_date: addDays(1),
      status: 'Tertunda',
      note: 'Dijadwalkan untuk besok pagi',
      sent_at: null
    },
    {
      user_id: userIds['satrio'],
      task_id: taskIds[6].id,
      to_email: 'satrio.wibowo@student.ac.id',
      task_name: 'Analisis Algoritma Dijkstra',
      h_days: 1,
      scheduled_date: addDays(1),
      status: 'Tertunda',
      note: 'Dijadwalkan',
      sent_at: null
    },
    {
      user_id: userIds['nadia_putri'],
      task_id: taskIds[9].id,
      to_email: 'nadia.putri@student.ac.id',
      task_name: 'Kuis Teori Graf & Kombinatorika',
      h_days: 1,
      scheduled_date: addDays(0),
      status: 'Berhasil',
      note: 'Terkirim',
      sent_at: `${addDays(0)} 06:30:00`
    }
  ];

  for (const en of emailNotifs) {
    await conn.query(`
      INSERT INTO email_notifications (user_id, task_id, to_email, task_name, h_days, scheduled_date, status, note, sent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [en.user_id, en.task_id, en.to_email, en.task_name, en.h_days, en.scheduled_date, en.status, en.note, en.sent_at]);
  }

  // 9. Populasi Tabel Khusus Notifikasi WhatsApp (wa_notifications)
  console.log('💬 Mengisi tabel khusus notifikasi WhatsApp...');
  const waNotifs = [
    {
      user_id: userIds['Mahasiswa'],
      task_id: taskIds[0].id,
      to_phone: '081298765432',
      task_name: 'Menyusun dokumen SRS',
      h_days: 1,
      scheduled_date: addDays(0),
      status: 'Berhasil',
      note: 'Pesan WA terkirim via Gateway',
      sent_at: `${addDays(0)} 07:05:00`
    },
    {
      user_id: userIds['Mahasiswa'],
      task_id: taskIds[1].id,
      to_phone: '081298765432',
      task_name: 'Membuat ERD & Skema Relasi',
      h_days: 3,
      scheduled_date: addDays(0),
      status: 'Berhasil',
      note: 'Pesan WA terkirim',
      sent_at: `${addDays(0)} 07:05:00`
    },
    {
      user_id: userIds['Mahasiswa'],
      task_id: taskIds[3].id,
      to_phone: '081298765432',
      task_name: 'Konfigurasi Jaringan Routing OSPF',
      h_days: 1,
      scheduled_date: addDays(1),
      status: 'Tertunda',
      note: 'Menunggu jadwal kirim',
      sent_at: null
    },
    {
      user_id: userIds['satrio'],
      task_id: taskIds[7].id,
      to_phone: '081345678901',
      task_name: 'Laporan Praktikum Sistem Operasi',
      h_days: 3,
      scheduled_date: addDays(1),
      status: 'Tertunda',
      note: 'Menunggu jadwal kirim',
      sent_at: null
    },
    {
      user_id: userIds['nadia_putri'],
      task_id: taskIds[9].id,
      to_phone: '081567890123',
      task_name: 'Kuis Teori Graf & Kombinatorika',
      h_days: 1,
      scheduled_date: addDays(0),
      status: 'Berhasil',
      note: 'Pesan WA terkirim',
      sent_at: `${addDays(0)} 06:35:00`
    }
  ];

  for (const wn of waNotifs) {
    await conn.query(`
      INSERT INTO wa_notifications (user_id, task_id, to_phone, task_name, h_days, scheduled_date, status, note, sent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [wn.user_id, wn.task_id, wn.to_phone, wn.task_name, wn.h_days, wn.scheduled_date, wn.status, wn.note, wn.sent_at]);
  }

  await conn.end();
  console.log('====================================================');
  console.log('🎉 SEEDING SELESAI! Data berhasil diisi ke MySQL:');
  console.log('  - users (4 akun: admin, Mahasiswa, satrio, nadia_putri)');
  console.log('  - tasks (11 tugas kuliah)');
  console.log('  - plans (6 rencana belajar harian)');
  console.log('  - notif_settings (4 pengaturan pengguna)');
  console.log('  - email_notifications (6 data log notifikasi email)');
  console.log('  - wa_notifications (5 data log notifikasi WhatsApp)');
  console.log('====================================================');
}

seed().catch(err => {
  console.error('❌ Gagal melakukan seeding:', err.message);
  process.exit(1);
});
