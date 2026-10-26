// ==========================================================================
// StudyTrack - Fitur Auth (fitur/auth/auth.js)
// Logika autentikasi: Login, Register, Lupa Password, Animasi Slide.
// ==========================================================================

// Helper querySelector singkat untuk mempermudah pemilihan elemen DOM
const $ = (s) => document.querySelector(s),
  box = $('#box');

// Helper fungsi request POST spesifik untuk endpoint /auth (seperti /auth/login, /auth/register, /auth/reset)
const post = (u, b) => api('POST', '/auth' + u, b);

// Fungsi navigasi/redirect pengguna yang berhasil login langsung ke halaman Dashboard
const goHome = (u) =>
  location.replace('../dashboard/dashboard.html');

// Helper untuk menampilkan notifikasi pesan status (sukses warna hijau, gagal warna merah) pada form
const msg = (f, t, ok) => {
  const m = f.querySelector('.msg');
  m.textContent = t;
  m.className = 'msg' + (ok ? ' ok' : '');
};

// Cek status sesi login: Jika pengguna sebelumnya sudah login, langsung lempar (redirect) ke Dashboard
api('GET', '/me')
  .then(goHome)
  .catch(() => {});

/**
 * Higher-order function untuk menangani pengiriman (submit) form secara asinkron.
 * Mencegah submit default, menonaktifkan tombol selama proses request berlangsung,
 * dan menangkap pesan error dari server untuk ditampilkan ke user.
 * 
 * @param {HTMLFormElement} f - Elemen form yang diproses
 * @param {Function} fn - Handler fungsi asynchronous operasi API
 */
const run = (f, fn) => {
  f.onsubmit = async (e) => {
    e.preventDefault();
    msg(f, '');
    const b = f.querySelector('.btn');
    b.disabled = true; // Cegah double-click atau spam request
    try {
      await fn(f);
    } catch (x) {
      msg(f, x.message); // Tampilkan pesan error jika request gagal
    }
    b.disabled = false; // Aktifkan kembali tombol setelah proses selesai
  };
};

// Event listener: Menggeser overlay panel ke form Registrasi (Buat Akun)
$('#goReg').onclick = () => box.classList.add('active');

// Event listener: Mengembalikan overlay panel ke form Sign In (Login)
$('#goLogin').onclick = () => box.classList.remove('active');

const ovTitle = $('.ovL h2');
const ovP1 = $('.ovL p:nth-of-type(1)');
const ovP2 = $('.ovL p:nth-of-type(2)');
const ovBtn = $('#goReg');

// Event listener: Berpindah tampilan dari Form Login ke Form Lupa Password (Reset)
$('#toReset').onclick = (e) => {
  e.preventDefault();
  $('#fLogin').classList.add('hide');
  $('#fReset').classList.remove('hide');
  if (ovTitle) ovTitle.textContent = 'Lupa Password?';
  if (ovP1) ovP1.textContent = 'Jangan khawatir, masukkan username dan email terdaftar untuk memperbarui kata sandi Anda.';
  if (ovP2) ovP2.innerHTML = 'Atau ingin membuat akun baru? <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px"><path d="M12 4v16M6 14l6 6 6-6" /></svg>';
  if (ovBtn) ovBtn.textContent = 'Daftar Baru';
};

// Event listener: Kembali dari Form Lupa Password ke Form Sign In (Login)
$('#toLogin').onclick = (e) => {
  e.preventDefault();
  $('#fReset').classList.add('hide');
  $('#fLogin').classList.remove('hide');
  if (ovTitle) ovTitle.textContent = 'Halo, Teman!';
  if (ovP1) ovP1.textContent = 'Sebelum memulai, silakan buat akun jika belum memilikinya';
  if (ovP2) ovP2.innerHTML = 'Ketuk button dibawah ini untuk membuat akun anda <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px"><path d="M12 4v16M6 14l6 6 6-6" /></svg>';
  if (ovBtn) ovBtn.textContent = 'Sign Up';
};

// Eksekusi Submit Form Login: Mengirim username dan password ke API /auth/login
run($('#fLogin'), async (f) =>
  goHome(await post('/login', { username: f.u.value.trim(), password: f.p.value })),
);

// Eksekusi Submit Form Registrasi: Mendaftarkan user baru dengan username, email, password, dan no telp
run($('#fReg'), async (f) => {
  await post('/register', {
    username: f.u.value.trim(),
    email: f.e.value.trim(),
    password: f.p.value,
    phone: f.t.value.trim(),
  });
  f.reset();
  msg(f, 'Akun dibuat! Silakan Sign In.', true);
  // Geser kembali ke panel login setelah akun berhasil dibuat
  setTimeout(() => {
    box.classList.remove('active');
    msg(f, '');
  }, 900);
});

// Eksekusi Submit Form Reset Password: Memvalidasi user/email dan memperbarui password baru
run($('#fReset'), async (f) => {
  await post('/reset', {
    username: f.u.value.trim(),
    email: f.e.value.trim(),
    password: f.p.value,
  });
  msg(f, 'Password diperbarui. Silakan Sign In.', true);
  // Otomatis kembalikan ke form login setelah password berhasil direset
  setTimeout(() => {
    $('#toLogin').click();
    f.reset();
    msg(f, '');
  }, 900);
});
