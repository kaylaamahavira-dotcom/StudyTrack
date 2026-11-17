// server.js — Entry point backend StudyTrack (MySQL)
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Validasi konfigurasi environment variables tanpa mencetak nilai sensitif
function validateEnvConfig() {
  if (!process.env.FONNTE_TOKEN || !process.env.FONNTE_TOKEN.trim()) {
    console.warn('⚠️ [Konfigurasi Environment] FONNTE_TOKEN belum dikonfigurasi di file .env.');
    console.warn('ℹ️ Fitur notifikasi WhatsApp tidak akan berjalan. Cek backend/.env.example sebagai panduan.');
  } else {
    console.log('✅ [Konfigurasi Environment] Kredensial WhatsApp API (FONNTE_TOKEN) terbaca.');
  }
}

const { initDB } = require('./db');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files (melayani frontend langsung jika diakses via server yang sama)
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// Redirect otomatis dari http://localhost:5000/ langsung ke halaman login frontend
app.get('/', (req, res) => {
  res.redirect('/frontend/auth/auth.html');
});

// Routes
app.use('/auth', authRoutes);
app.use('/', apiRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Terjadi kesalahan pada server' });
});

// Mulai inisialisasi database dan jalankan server
async function startServer() {
  try {
    validateEnvConfig();
    await initDB();
    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 StudyTrack MySQL Backend aktif di port ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📁 Frontend: http://localhost:${PORT}/frontend/auth/auth.html`);
      console.log(`🗄️ Database: MySQL (${process.env.DB_NAME || 'studytrack_db'})`);
      console.log(`=========================================`);
    });

    const { startScheduler } = require('./services/notifScheduler');
    startScheduler();
    console.log('📱 WhatsApp scheduler: aktif');
  } catch (err) {
    console.error('❌ Gagal menghubungkan ke MySQL:', err.message);
    console.error('Pastikan service MySQL Anda (XAMPP / Laragon / MySQL Service) sudah berjalan.');
  }
}

startServer();