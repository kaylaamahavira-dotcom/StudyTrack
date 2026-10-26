// ==========================================================================
// StudyTrack - Fitur Kalender (fitur/calendar/calendar.js)
// Mengatur: Navigasi Bulan, Pembangkit Kisi Matriks Tanggal (Calendar Grid),
// Indikator Titik Deadline Tugas Aktif, dan Penampil Rincian Tugas Harian.
// ==========================================================================

// State lokal: Bulan yang sedang ditampilkan dan tanggal yang sedang dipilih (format YYYY-MM-DD)
let cur = new Date(),
  sel = iso(new Date());

/**
 * Fungsi Utama Render Kalender
 * Menghitung hari pertama dalam bulan, total jumlah hari, me-render header nama hari,
 * serta menyematkan titik penanda (dot) bagi tanggal yang memiliki deadline tugas aktif.
 */
function render() {
  if (typeof tasks !== 'function') return;
  const y = cur.getFullYear(),
    m = cur.getMonth();
  
  // Format teks judul bulan dan tahun (Contoh: "Oktober 2026")
  $('#month').textContent = new Date(y, m, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  const first = new Date(y, m, 1).getDay(); // Indeks hari pertama bulan (0 = Minggu, 1 = Senin, dst)
  const days = new Date(y, m + 1, 0).getDate(); // Total jumlah hari dalam bulan aktif
  const t = tasks(); // Mengambil daftar tugas global

  // Helper untuk mengecek apakah pada tanggal d ada tugas aktif yang belum selesai
  const has = (d) => t.some((x) => x.date === d && !x.done);

  // Baris header nama-nama hari
  let h = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    .map((d) => `<div class="dn">${d}</div>`)
    .join('');

  // Menambahkan slot kosong sebelum tanggal 1 agar posisi hari sejajar
  for (let i = 0; i < first; i++) h += '<div></div>';

  // Men-generate tombol-tombol tanggal dari 1 sampai akhir bulan
  for (let d = 1; d <= days; d++) {
    const dt = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dt === iso(new Date());
    h += `<button class="day ${dt === sel ? 'sel' : ''} ${isToday ? 'today' : ''}" data-d="${dt}">${d}${has(dt) ? '<span class="dot"></span>' : ''}</button>`;
  }
  $('#grid').innerHTML = h;

  // Render rincian daftar tugas pada tanggal yang sedang terpilih
  renderDay();
}

/**
 * Menampilkan rincian daftar tugas pada tanggal yang sedang dipilih di panel samping
 */
function renderDay() {
  $('#dayTitle').textContent = `Tugas: ${fmt(sel)}`;
  const list = tasks().filter((x) => x.date === sel);
  $('#dayList').innerHTML = list.length
    ? list
        .map(
          (x) =>
            `<div class="ev">${esc(x.name)}<small>${esc(x.course || '-')} · ${x.prio}${x.done ? ' · (Selesai)' : ''}</small></div>`,
        )
        .join('')
    : '<div class="empty">Tidak ada tugas pada tanggal ini.</div>';
}

// Event listener: Navigasi mundur ke bulan sebelumnya
$('#prev').onclick = () => {
  cur.setMonth(cur.getMonth() - 1);
  render();
};

// Event listener: Navigasi maju ke bulan berikutnya
$('#next').onclick = () => {
  cur.setMonth(cur.getMonth() + 1);
  render();
};

// Event delegation: Menangani klik pemilihan tanggal pada kisi kalender
$('#grid').onclick = (e) => {
  const b = e.target.closest('.day');
  if (!b) return;
  sel = b.dataset.d;
  $$('.day').forEach((x) => x.classList.toggle('sel', x === b));
  renderDay();
};

// Daftarkan render ke global scope agar tersinkronisasi saat state ready
window.render = render;
window.addEventListener('studytrack:ready', render);
render();
