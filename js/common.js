// ==========================================================================
// StudyTrack - Core Framework & Shared Logic (js/common.js)
// Mengatur: Shell Layout (Sidebar & Header Navigasi), Sinkronisasi State Global,
// Dialog Konfirmasi Kustom, Toast Notification, dan Modal Edit Profil.
// ==========================================================================

// Helper querySelector: Memilih satu elemen DOM
const $ = (s, e = document) => e.querySelector(s),
  // Helper querySelectorAll: Memilih kumpulan elemen DOM dan mengembalikannya sebagai Array asli
  $$ = (s, e = document) => [...e.querySelectorAll(s)];

// Helper sanitasi HTML: Mencegah serangan XSS (Cross-Site Scripting) dengan meng-escape karakter berbahaya
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

// State Global Aplikasi: Menampung data user, tugas, target belajar, dan preferensi notifikasi
let S = { user: null, tasks: [], plans: [], notif: null };

// Getter fungsi untuk mengakses state secara reaktif & bersih
const me = () => S.user,
  tasks = () => S.tasks,
  plans = () => S.plans,
  notif = () => S.notif;

/* ==========================================================================
   1. CUSTOM TOAST NOTIFICATION SYSTEM
   Menampilkan notifikasi pop-up cantik di pojok layar untuk feedback aksi user
   ========================================================================== */

/**
 * Menampilkan pesan toast floating otomatis menutup dalam 4 detik
 * 
 * @param {string} message - Pesan yang ingin disampaikan
 * @param {string} [type='success'] - Varian toast: 'success' | 'error' | 'info' | 'warning'
 * @param {string} [title=''] - Judul header toast kustom (opsional)
 */
function showToast(message, type = 'success', title = '') {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    document.body.appendChild(c);
  }

  // Simbol icon penanda jenis status pesan
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  };

  // Judul default sesuai jenis status
  const titles = {
    success: 'Berhasil',
    error: 'Terjadi Kesalahan',
    info: 'Informasi',
    warning: 'Peringatan'
  };

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <div class="toast-ic">${icons[type] || 'ℹ'}</div>
    <div class="toast-body">
      <b>${esc(title || titles[type] || '')}</b>
      <p>${esc(message)}</p>
    </div>
    <button type="button" class="toast-close" aria-label="Tutup">&times;</button>
  `;

  c.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));

  // Handler animasi keluar saat toast ditutup
  const removeToast = () => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 250);
  };

  el.querySelector('.toast-close').onclick = removeToast;
  setTimeout(removeToast, 4000); // Otomatis hilang setelah 4 detik
}

/* ==========================================================================
   2. CUSTOM CONFIRM MODAL DIALOG SYSTEM
   Pengganti dialog native window.confirm() dengan antarmuka modern berbasis Promise
   ========================================================================== */

/**
 * Memunculkan popup konfirmasi interaktif (asynchronous)
 * 
 * @param {Object} options - Konfigurasi modal
 * @param {string} [options.title='Konfirmasi'] - Judul konfirmasi
 * @param {string} [options.message='Apakah Anda yakin...?'] - Pertanyaan aksi
 * @param {string} [options.okText='Ya, Lanjutkan'] - Teks tombol konfirmasi
 * @param {string} [options.cancelText='Batal'] - Teks tombol batal
 * @param {string} [options.type='danger'] - Tema visual: 'danger' (merah/hapus) | 'info' (biru)
 * @returns {Promise<boolean>} Resolve true jika diklik Ok/Setuju, false jika dibatalkan
 */
function showConfirm({
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin ingin melanjutkan?',
  okText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'danger'
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay';

    const isDanger = type === 'danger';
    const iconChar = isDanger ? '!' : '?';

    overlay.innerHTML = `
      <div class="confirm-modal-box confirm-${type}">
        <div class="confirm-modal-hd">
          <div class="confirm-modal-ic">${iconChar}</div>
          <h3>${esc(title)}</h3>
        </div>
        <p class="confirm-modal-body">${esc(message)}</p>
        <div class="confirm-modal-acts">
          <button type="button" class="btn-confirm-cancel">${esc(cancelText)}</button>
          <button type="button" class="btn-confirm-ok ${isDanger ? '' : 'primary'}">${esc(okText)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = (result) => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 180);
      resolve(result);
    };

    overlay.querySelector('.btn-confirm-cancel').onclick = () => close(false);
    overlay.querySelector('.btn-confirm-ok').onclick = () => close(true);
    overlay.onclick = (e) => {
      if (e.target === overlay) close(false);
    };
  });
}

/* ==========================================================================
   3. DATA PERSISTENCE HELPERS
   Fungsi sinkronisasi data ke penyimpanan backend/lokal melalui API
   ========================================================================== */

/**
 * Menyimpan array daftar tugas ke database dan menampilkan notifikasi
 * @param {Array} t - Array data tugas
 */
const saveTasks = (t) => {
  S.tasks = t;
  api('PUT', '/tasks', t)
    .then(() => showToast('Daftar tugas berhasil diperbarui!', 'success'))
    .catch((e) => showToast(e.message, 'error'));
};

/**
 * Menyimpan array target/rencana belajar harian ke database
 * @param {Array} p - Array data rencana belajar
 */
const savePlans = (p) => {
  S.plans = p;
  api('PUT', '/plans', p)
    .then(() => showToast('Rencana belajar berhasil disimpan!', 'success'))
    .catch((e) => showToast(e.message, 'error'));
};

/* ==========================================================================
   4. DATE & PRIORITY UTILITIES
   Format tanggal Indonesia dan kalkulasi prioritas otomatis berdasarkan deadline
   ========================================================================== */

// Konversi objek Date ke format ISO 'YYYY-MM-DD'
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Format tanggal ke gaya lokal Indonesia: Contoh: '24 Okt 2026'
const fmt = (d) =>
  new Date(d + 'T00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

// Menghitung selisih sisa hari antara deadline dengan hari ini
const daysLeft = (d) =>
  Math.round((new Date(d + 'T00:00') - new Date().setHours(0, 0, 0, 0)) / 864e5);

/**
 * Skala prioritas otomatis berdasarkan jarak deadline:
 * ≤ 3 hari (termasuk hari ini / terlewat): Tinggi
 * 4 - 6 hari: Sedang
 * ≥ 7 hari: Rendah
 */
const calcPrio = (d) => {
  if (!d) return 'Sedang';
  const dl = daysLeft(d);
  if (dl <= 3) return 'Tinggi';
  if (dl <= 6) return 'Sedang';
  return 'Rendah';
};

// Merender badge HTML untuk status prioritas / selesai
const badge = (t) =>
  t.done
    ? '<span class="b Selesai">Selesai</span>'
    : `<span class="b ${t.prio}">${t.prio === 'Tinggi' ? 'Prioritas Tinggi' : t.prio}</span>`;

// Merender foto avatar user atau inisial huruf pertama jika belum ada foto
const avatar = (u) =>
  u.avatar ? `<img src="${u.avatar}" alt="">` : esc(u.username[0].toUpperCase());

/* ==========================================================================
   5. VECTOR ICONS (SVG LIBRARY)
   Kumpulan path icon SVG ringan tanpa dependensi library eksternal
   ========================================================================== */
const ICON = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  list: '<path d="M3.5 6l1.5 1.5L8 4.5M3.5 13l1.5 1.5 3-3M12 6h9M12 13h9M4 20h17"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  chart: '<path d="M6 20v-6M12 20V6M18 20v-9"/>',
  bell: '<path d="M6 16v-5a6 6 0 0112 0v5l2 2H4z"/><path d="M10 21h4"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12l3 3 5-6"/>',
  alarm: '<circle cx="12" cy="13" r="7"/><path d="M12 9v4l2 2M4 5l3-2M20 5l-3-2"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
  users:
    '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 5a3.5 3.5 0 010 7M18 14c2.2.6 3.5 2.6 3.5 6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chev: '<path d="M6 9l6 6 6-6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
};

// Helper membungkus path icon ke dalam format tag <svg>
const svg = (n) =>
  `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

const pathDecoded = decodeURIComponent(location.pathname.replace(/\\/g, '/'));
const folderPrefix = '../';

// Struktur Daftar Navigasi Menu Utama Sidebar
const NAV = () => {
  const getHref = (fn, id) => `${folderPrefix}${id}/${fn}`;
  return [
    [getHref('dashboard.html', 'dashboard'), 'Beranda', 'home', 'dashboard'],
    [getHref('tasks.html', 'tasks'), 'Daftar Tugas', 'list', 'tasks'],
    [getHref('calendar.html', 'calendar'), 'Kalender', 'calendar', 'calendar'],
    [getHref('stats.html', 'stats'), 'Statistik', 'chart', 'stats'],
    [getHref('notifications.html', 'notifications'), 'Notifikasi', 'bell', 'notifications'],
  ];
};

// Menentukan identitas halaman saat ini berdasarkan nama file URL
const page = location.pathname.split('/').pop().replace('.html', '') || 'dashboard';

/* ==========================================================================
   6. RENDER SHELL (SIDEBAR & HEADER ATAS)
   Membangun layout global sidebar, logo, profil user, dan header halaman
   ========================================================================== */
function renderShell() {
  const u = me(),
    top = $('#top');
  const notifHref = `${folderPrefix}notifications/notifications.html`;
  const loginHref = `${folderPrefix}auth/auth.html`;
  const logoHref = `${folderPrefix}../assets/img/logo.png`;

  // Render Sidebar Lengkap (Logo, Menu Navigasi, Profil Samping, Tombol Keluar)
  $('#side').innerHTML = `<div class="logo"><img src="${logoHref}" alt="StudyTrack Logo">StudyTrack</div><nav>${NAV()
    .map(
      (n) =>
        `<a href="${n[0]}" class="${n[3] === page ? 'on' : ''}"><span class="ic">${svg(n[2])}</span> ${n[1]}</a>`,
    )
    .join('')}</nav>
 <div class="me"><div class="av">${avatar(u)}</div><div><b>${esc(u.username)}</b><small>${esc(u.email || '')}</small></div></div><button class="out" id="logout">Keluar</button>`;
  
  // Penentuan teks salam & judul header
  const title =
    top.dataset.title === 'Selamat Datang'
      ? `Selamat Datang, ${esc(u.username)}`
      : top.dataset.title;
  top.className = 'head';

  // Render Header Atas (Tanggal Hari Ini, Judul, Tombol Notifikasi Lonceng, Chip Profil Kanan Atas)
  top.innerHTML = `<div><small>${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small><h1>${title}</h1><p>${top.dataset.sub}</p></div>
 <div class="tools">${u.role === 'admin' ? '' : `<a class="bell" href="${notifHref}" style="text-decoration:none"><span class="ic">${svg('bell')}</span></a>`}<div class="chip" id="prof"><div class="av sm">${avatar(u)}</div><div class="chip-t"><b>${esc(u.username)}</b><small>Edit Profile</small></div><span class="chev">${svg('chev')}</span></div></div>`;
  
  // Handler Logout Pengguna dengan konfirmasi interaktif
  $('#logout').onclick = async () => {
    const ok = await showConfirm({
      title: 'Konfirmasi Keluar',
      message: 'Apakah kamu yakin ingin keluar dari akun StudyTrack?',
      okText: 'Ya, Keluar',
      cancelText: 'Tetap di Sini',
      type: 'danger'
    });
    if (!ok) return;

    showToast('Sedang keluar...', 'info');
    api('POST', '/auth/logout').finally(() => {
      location.href = loginHref;
    });
  };

  // Handler membuka dialog modal Edit Profil saat chip profil diklik
  $('#prof').onclick = profileModal;
}

/* ==========================================================================
   7. MODAL EDIT PROFILE & PASSWORD
   Form popup untuk mengubah nama profil, upload foto avatar, dan ganti password
   ========================================================================== */
function profileModal() {
  const u = me(),
    m = document.createElement('div');
  m.className = 'modal';
  let img = u.avatar || '';

  // Render formulir modal ganti profil
  m.innerHTML = `<form class="pm"><div class="hd"><h1>Ubah Profile</h1><button type="button" class="x" id="px" aria-label="Tutup">${svg('x')}</button></div>
 <p style="margin:0;font-size:13px">Perbarui foto, nama pengguna, dan kata sandi akunmu.</p>
 <div class="av-row"><div class="av" id="pv"></div><div class="av-b"><label class="btn" style="cursor:pointer;font-size:12px;padding:6px 14px">Ganti Foto<input type="file" id="pfile" accept="image/png,image/jpeg,image/gif,image/webp" hidden></label>
  <button type="button" class="lnk" id="prm">Hapus foto</button><small>JPG, PNG, GIF, atau WEBP. Maks. 1,5 MB</small></div></div>
 <div class="sec">Akun</div>
 <label>Username<input name="u" value="${esc(u.username)}" required></label>
 <label>Email<input value="${esc(u.email || '')}" disabled></label>
 <div class="sec">Ganti Password (kosongkan jika tidak diubah)</div>
 <div class="g2"><label>Password Baru<input name="p" type="password" placeholder="Password baru" autocomplete="new-password"></label><label>Ulangi Password<input name="p2" type="password" placeholder="Konfirmasi password" autocomplete="new-password"></label></div>
 <em id="pe" style="color:#c0392b;font-size:12px;font-style:normal;min-height:14px"></em>
 <div class="act"><button type="button" class="btn ghost" id="pc">Batal</button><button class="btn">Simpan Perubahan</button></div></form>`;
  
  document.body.append(m);

  // Helper menutup modal & membersihkan event listener ESC
  const close = () => {
      m.remove();
      document.removeEventListener('keydown', esc2);
    },
    esc2 = (e) => {
      if (e.key === 'Escape') close();
    },
    // Helper me-render preview gambar avatar
    pv = () => {
      $('#pv', m).innerHTML = avatar({ ...u, avatar: img });
      $('#prm', m).hidden = !img;
    };

  document.addEventListener('keydown', esc2);
  m.onclick = (e) => {
    if (e.target === m) close(); // Tutup jika klik backdrop luar
  };
  $('#pc', m).onclick = $('#px', m).onclick = close;
  pv();

  // Handler Hapus foto avatar
  $('#prm', m).onclick = () => {
    img = '';
    $('#pfile', m).value = '';
    pv();
  };

  // Handler Memilih & membaca file gambar avatar dengan FileReader API
  $('#pfile', m).onchange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 1.5e6) {
      $('#pe', m).textContent = 'Gambar maksimal 1,5 MB.';
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      img = r.result; // Format DataURL (Base64)
      $('#pe', m).textContent = '';
      pv();
    };
    r.readAsDataURL(f);
  };

  // Handler Simpan pembaruan profil user ke database
  $('form', m).onsubmit = (e) => {
    e.preventDefault();
    const f = e.target,
      er = $('#pe', m);
    if (f.p.value && f.p.value !== f.p2.value)
      return (er.textContent = 'Konfirmasi password tidak sama.');
    api('PUT', '/me', { username: f.u.value.trim(), password: f.p.value || undefined, avatar: img })
      .then(() => location.reload())
      .catch((x) => (er.textContent = x.message));
  };
}

/* ==========================================================================
   8. APPLICATION LIFECYCLE INITIALIZER (BOOTSTRAP)
   Eksekusi utama saat script dimuat: Autentikasi sesi & inisialisasi modul halaman
   ========================================================================== */
(async () => {
  const loginHref = `${folderPrefix}auth/auth.html`;
  try {
    // Ambil data bootstrap awal dari server / local database
    S = await api('GET', '/bootstrap');
  } catch {
    // Jika belum login atau sesi kadaluarsa, arahkan ke halaman Sign In
    location.replace(loginHref);
    return;
  }

  // Bangun komponen antarmuka sidebar dan header atas
  renderShell();

  // Sisipkan icon SVG otomatis pada elemen yang memiliki atribut data-ic
  $$('[data-ic]').forEach((e) => (e.innerHTML = svg(e.dataset.ic)));

  // Jalankan fungsi render spesifik halaman jika sudah tersedia
  if (typeof window.render === 'function') {
    try { window.render(); } catch (err) { console.warn(err); }
  }

  // Pancarkan event global bahwa data StudyTrack siap digunakan
  window.dispatchEvent(new CustomEvent('studytrack:ready', { detail: S }));

  // Muat skrip controller spesifik halaman (misal: dashboard.js, tasks.js) jika belum ada
  if (!document.querySelector(`script[src*="${page}.js"]`)) {
    const sc = document.createElement('script');
    sc.src = `${page}.js`;
    document.body.append(sc);
  }
})();
