// ==========================================================================
// StudyTrack - Mock API & Local Storage Engine (js/api.js)
// Berfungsi sebagai simulasi REST API backend secara 100% Client-side.
// Menyimpan seluruh data aplikasi (akun, tugas, rencana, notifikasi) ke browser localStorage.
// ==========================================================================

/**
 * Objek wrapper untuk membaca & menulis data ke browser localStorage
 */
const _ls = {
  /**
   * Mengambil dan mem-parsing data JSON dari localStorage 'st_demo_local'
   * @returns {Object|null} Objek database lokal atau null jika belum ada / corrupt
   */
  get() {
    try {
      return JSON.parse(localStorage.getItem('st_demo_local'));
    } catch {
      return null;
    }
  },
  /**
   * Menyimpan serialisasi objek data ke dalam localStorage
   * @param {Object} d - Data database yang akan disimpan
   */
  set(d) {
    localStorage.setItem('st_demo_local', JSON.stringify(d));
  },
};

// Data template konfigurasi default notifikasi pengguna
const _notif0 = {
  mail: 'mahasiswa@student.ac.id',
  wa: '081234567890',
  onMail: true,
  onWa: true,
  rem: ['7', '3', '1'], // Pengingat H-7, H-3, dan H-1
};

/**
 * Menginisialisasi data awal (Dummy Seed Data) pertama kali saat aplikasi dibuka
 * Berisi akun default demo, daftar tugas kuliah, rencana belajar harian, dan notifikasi.
 * @returns {Object} Database lokal terinisialisasi
 */
function _seed() {
  // Helper menghitung offset hari dari hari ini dalam format YYYY-MM-DD
  const f = (n) => {
      const x = new Date();
      x.setDate(x.getDate() + n);
      return x.toISOString().slice(0, 10);
    },
    // Helper pembuatan objek tugas baru
    t = (i, n, d, p, x) => ({
      id: Date.now() + i,
      name: n,
      date: f(d),
      prio: p,
      notes: '',
      done: !!x,
    });

  const d = {
    seq: 3, // Auto-increment sequence ID user
    session: null, // ID user yang sedang login aktif
    plans: {
      1: [
        { id: 1, name: 'Review Materi Rekayasa Perangkat Lunak', min: 45, done: true, date: f(0) },
        { id: 2, name: 'Latihan Query SQL Join & Indexing', min: 60, done: false, date: f(0) }
      ]
    },
    users: [
      {
        id: 1,
        username: 'mahasiswa',
        email: 'mahasiswa@student.ac.id',
        phone: '081234567890',
        password: 'test', // Password login demo bisa 'test' atau '123456'
        role: 'user',
        avatar: '',
      },
    ],
    notif: { 1: _notif0 },
    tasks: {
      1: [
        t(1, 'Menyusun dokumen SRS', 1, 'Tinggi'),
        t(2, 'Membuat ERD', 3, 'Sedang'),
        t(3, 'Membuat wireframe', 7, 'Sedang'),
        t(4, 'Melakukan konfigurasi jaringan', 2, 'Tinggi'),
        t(5, 'Membuat Diagram UML', -1, 'Sedang', 1),
      ],
    },
  };
  _ls.set(d);
  return d;
}

/**
 * Router & Controller Mock API: Menangani request seperti HTTP Server sungguhan
 * 
 * @param {string} m - HTTP Method ('GET', 'POST', 'PUT', 'DELETE')
 * @param {string} u - URL Endpoint API (misal: '/auth/login', '/tasks', '/me')
 * @param {Object} b - Request Body (payload data JSON)
 * @returns {Object} Hasil response data JSON
 */
function local(m, u, b) {
  const db = _ls.get() || _seed(),
    iso = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    save = () => _ls.set(db),
    fail = (c, t) => {
      // Melempar error dengan HTTP status code (misal: 400 Bad Request, 401 Unauthorized)
      throw Object.assign(new Error(t), { status: c });
    };
  b = b || {};

  // Migrasi skema versi lokal jika diperlukan
  if (!db.v) {
    db.v = 2;
    if (!db.notif[1]) db.notif[1] = _notif0;
    _ls.set(db);
  }

  // Filter properti publik user (menghilangkan password dari return object demi keamanan)
  const pub = (x) => ({
    id: x.id,
    username: x.username,
    email: x.email,
    phone: x.phone,
    role: x.role,
    avatar: x.avatar,
  });

  // Pencarian user berdasarkan username (case-insensitive)
  const find = (n) =>
    db.users.find((x) => x.username.toLowerCase() === String(n || '').toLowerCase());

  // Mengambil data user yang sedang aktif di sesi sekarang
  const cur = () => db.users.find((x) => x.id === db.session) || fail(401, 'Belum login');

  // Validasi format username (3-30 karakter alphanumeric)
  const okU = (n) =>
    /^[\w.\-]{3,30}$/.test(n) ||
    fail(400, 'Username 3-30 karakter (huruf, angka, titik, strip, garis bawah).');

  // Validasi panjang password minimal 6 karakter
  const pw = (p) => String(p || '').length >= 6 || fail(400, 'Password minimal 6 karakter.');

  // ==========================================
  // DISPATCH ROUTE ENDPOINTS
  // ==========================================
  switch (m + ' ' + u.replace(/\/\d+/, '/:id')) {
    // 1. Endpoint Pendaftaran Akun Baru
    case 'POST /auth/register':
      okU(b.username);
      if (!/^\S+@\S+\.\S+$/.test(b.email || '')) fail(400, 'Email tidak valid.');
      pw(b.password);
      if (find(b.username)) fail(409, 'Username sudah dipakai.');
      db.users.push({
        id: db.seq++,
        username: b.username,
        email: b.email,
        phone: b.phone || '',
        password: b.password,
        role: 'user',
        avatar: '',
      });
      save();
      return { ok: true };

    // 2. Endpoint Masuk / Autentikasi Pengguna
    case 'POST /auth/login': {
      const x = find(b.username);
      // Mendukung password demo khusus '123456' / 'test' untuk akun mahasiswa
      const isPasswordMatch = x && (x.password === b.password || (x.username === 'mahasiswa' && (b.password === '123456' || b.password === 'test')));
      if (!x || !isPasswordMatch) fail(401, 'Username atau password salah.');
      db.session = x.id; // Simpan sesi user aktif
      save();
      return pub(x);
    }

    // 3. Endpoint Logout / Keluar Sesi
    case 'POST /auth/logout':
      db.session = null;
      save();
      return { ok: true };

    // 4. Endpoint Lupa Password / Reset Kata Sandi
    case 'POST /auth/reset': {
      const x = find(b.username);
      if (
        !x ||
        x.email.toLowerCase() !==
          String(b.email || '')
            .trim()
            .toLowerCase()
      )
        fail(400, 'Username dan email tidak cocok.');
      pw(b.password);
      x.password = b.password;
      save();
      return { ok: true };
    }

    // 5. Endpoint Cek Data Profil Pengguna Saat Ini
    case 'GET /me':
      return pub(cur());

    // 6. Endpoint Memperbarui Profil (Username, Password, Foto Avatar)
    case 'PUT /me': {
      const x = cur();
      if (b.username !== undefined && b.username !== x.username) {
        okU(b.username);
        if (
          db.users.some(
            (y) => y.id !== x.id && y.username.toLowerCase() === b.username.toLowerCase(),
          )
        )
          fail(409, 'Username sudah dipakai.');
        x.username = b.username;
      }
      if (b.password) {
        pw(b.password);
        x.password = b.password;
      }
      if (b.avatar !== undefined) x.avatar = b.avatar;
      save();
      return pub(x);
    }

    // 7. Endpoint Inisialisasi Pertama (Bootstrap) Mengambil data lengkap user, tugas, target, notifikasi
    case 'GET /bootstrap': {
      const x = cur();
      return {
        user: pub(x),
        tasks: db.tasks[x.id] || [],
        plans: db.plans[x.id] || [],
        notif: db.notif[x.id] || null,
      };
    }

    // 8. Endpoint Simpan Pembaruan Seluruh Daftar Tugas
    case 'PUT /tasks':
      db.tasks[cur().id] = b;
      save();
      return { ok: true };

    // 9. Endpoint Simpan Pembaruan Rencana / Target Belajar
    case 'PUT /plans':
      db.plans[cur().id] = b;
      save();
      return { ok: true };

    // 10. Endpoint Simpan Konfigurasi Notifikasi & Pengingat
    case 'PUT /notif':
      db.notif[cur().id] = b;
      save();
      return { ok: true };
  }
  fail(404, 'Endpoint tidak ditemukan.');
}

/**
 * Fungsi Utama HTTP Client Wrapper (Kompatibel dengan arsitektur async/await Fetch API)
 * Digunakan oleh semua modul frontend untuk berkomunikasi dengan data aplikasi.
 * 
 * @param {string} m - HTTP Method ('GET', 'POST', 'PUT', 'DELETE')
 * @param {string} u - Endpoint path API
 * @param {Object} [b] - Payload data yang dikirim
 * @returns {Promise<any>} Response hasil operasi
 */
const api = async (m, u, b) => {
  return local(m, u, b);
};
