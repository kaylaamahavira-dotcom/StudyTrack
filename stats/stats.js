// ==========================================================================
// StudyTrack - Fitur Statistik (fitur/stats/stats.js)
// Mengatur: Kalkulasi Metrik Belajar, Pembuatan Bar Chart Mingguan (CSS Bar),
// Diagram Donat Berbasis Conic Gradient, serta Progress Bar Tugas Selesai.
// ==========================================================================

/**
 * Fungsi Utama Render Statistik
 * Menghitung rekapitulasi tugas (Total, Belum Selesai, Selesai),
 * mengkalkulasi durasi jam belajar per hari selama seminggu terakhir,
 * dan menghasilkan visualisasi chart interaktif.
 */
function render() {
  if (typeof tasks !== 'function') return;
  const t = tasks(), // Mengambil daftar tugas global
    open = t.filter((x) => !x.done), // Tugas aktif belum selesai
    done = t.filter((x) => x.done); // Tugas yang telah selesai

  // 1. Tampilkan jumlah data ke 3 kartu ringkasan tugas
  $('#sTotal').textContent = t.length;
  $('#sOpen').textContent = open.length;
  $('#sDone').textContent = done.length;

  // 2. Kalkulasi Jam Belajar Mingguan (Senin s/d Minggu)
  const pl = plans(),
    now = new Date();
  const start = new Date(now);
  // Mundurkan tanggal ke hari Senin terdekat di minggu aktif
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const todayKey = iso(now);
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  
  // Hitung akumulasi jam belajar per hari untuk rencana belajar yang SUDAH SELESAI (done)
  const perDay = days.map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = iso(d);
    return (
      pl
        .filter((p) => p.done && (p.date === key || (!p.date && key === todayKey)))
        .reduce((s, p) => s + (p.min || 0), 0) / 60
    );
  });

  // Total jam belajar dalam 7 hari
  const totHours = perDay.reduce((a, b) => a + b, 0);
  $('#sHours').textContent = totHours.toFixed(1).replace('.', ',') + ' Jam';

  // 3. Render Diagram Batang (Bar Chart) Mingguan
  const max = Math.max(1, ...perDay); // Nilai maksimum sebagai patokan tinggi 100% grafik
  $('#chart').innerHTML = perDay
    .map(
      (v, i) =>
        `<div><b>${v > 0 ? v.toFixed(1).replace('.', ',') : ''}</b><i style="height:${(v / max) * 100}%; min-height:${v > 0 ? '6px' : '0'};"></i><span>${days[i]}</span></div>`,
    )
    .join('');

  // 4. Render Diagram Donat (Donut Chart) Komposisi Prioritas Tugas
  const prio = {
    Tinggi: { c: '#c0392b', n: t.filter((x) => x.prio === 'Tinggi').length },
    Sedang: { c: '#8fa800', n: t.filter((x) => x.prio === 'Sedang').length },
    Rendah: { c: '#2a5a99', n: t.filter((x) => x.prio === 'Rendah').length },
  };
  const tot = t.length || 1;
  let deg = 0,
    grad = [];

  // Hitung sudut derajat lingkaran penuh (360 derajat) untuk setiap kategori prioritas
  for (const k in prio) {
    const d = (prio[k].n / tot) * 360;
    grad.push(`${prio[k].c} ${deg}deg ${deg + d}deg`);
    deg += d;
  }
  // Aplikasikan conic-gradient ke elemen donat
  $('#donut').style.background = t.length ? `conic-gradient(${grad.join(',')})` : '#ddd';
  
  // Render teks legenda keterangan warna diagram donat
  $('#legend').innerHTML = Object.entries(prio)
    .map(([k, v]) => `<div class="lg" style="--c:${v.c}"><u>${k}</u><b>${v.n} tugas</b></div>`)
    .join('');

  // 5. Render Progress Bar Persentase Keseluruhan Tugas Selesai
  const pct = t.length ? Math.round((done.length / t.length) * 100) : 0;
  $('#pct').textContent = pct + '%';
  $('#pbar').style.width = pct + '%';
  $('#pmsg').textContent = `${done.length} dari ${t.length} tugas telah diselesaikan`;
}

// Hubungkan siklus hidup render dengan event studytrack:ready
window.render = render;
window.addEventListener('studytrack:ready', render);
render();
