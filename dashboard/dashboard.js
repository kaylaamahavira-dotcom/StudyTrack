// ==========================================================================
// StudyTrack - Fitur Dashboard (fitur/dashboard/dashboard.js)
// Mengatur: Kalkulasi Ringkasan Widget, Filter Prioritas Tugas,
// serta Pengelolaan Checklist & Target Rencana Belajar Harian.
// ==========================================================================

// State lokal: Menyimpan opsi filter tugas yang aktif ('all' | 'urgent' | 'high')
let filter = 'all';

/**
 * Fungsi Utama Render Dashboard
 * Menghitung metrik kartu statistik, memfilter daftar tugas prioritas,
 * serta me-render checklist target belajar harian.
 */
function render() {
  if (typeof tasks !== 'function') return;
  const t = tasks(); // Mengambil data array tugas dari global state
  const act = t.filter((x) => !x.done); // Memfilter tugas yang belum selesai
  const pr = t.length ? Math.round(((t.length - act.length) / t.length) * 100) : 0; // Persentase progres
  const pl = plans(); // Mengambil rencana belajar harian
  const doneMins = pl.filter((p) => p.done).reduce((s, p) => s + p.min, 0); // Akumulasi menit yang sudah dipelajari
  const totalMins = pl.reduce((s, p) => s + p.min, 0); // Total target menit belajar

  // Mengurutkan tugas aktif berdasarkan tanggal deadline terdekat
  const sortedAct = act.slice().sort((a, b) => a.date.localeCompare(b.date));
  const earliestDate = sortedAct.length ? sortedAct[0].date : null;
  const closestTasks = earliestDate ? sortedAct.filter((x) => x.date === earliestDate) : [];

  // Menentukan sub-teks nama tugas pada kartu deadline terdekat
  let nextSubText = 'Semua tugas selesai';
  if (closestTasks.length === 1) {
    nextSubText = closestTasks[0].name;
  } else if (closestTasks.length > 1) {
    const names = closestTasks.map((x) => x.name);
    nextSubText = `${names.slice(0, 2).join(', ')}${names.length > 2 ? ` (+${names.length - 2} lainnya)` : ` (${names.length} tugas)`}`;
  }

  // 1. Tampilkan data ke 4 Kartu Statistik Atas
  $('#sActive').textContent = act.length;
  $('#sNext').textContent = earliestDate ? fmt(earliestDate) : 'Tidak ada';
  $('#sNextSub').textContent = nextSubText;
  $('#sNextSub').title = closestTasks.map((x) => x.name).join(', ');
  $('#sProg').textContent = pr + '%';
  $('#sBar').style.width = pr + '%';
  
  // Format jam belajar (konversi dari total menit ke format jam, misal: 1,5 jam)
  const doneHours = (doneMins / 60).toFixed(doneMins % 60 ? 1 : 0).replace('.', ',');
  const totalHours = (totalMins / 60).toFixed(totalMins % 60 ? 1 : 0).replace('.', ',');
  $('#sStudy').textContent = doneHours + ' jam';
  const studySub = $('#sStudySub');
  if (studySub) {
    studySub.textContent = totalMins ? `Target: ${totalHours} jam (${doneMins}/${totalMins} m)` : 'Belum ada rencana';
  }

  // 2. Filter Daftar Tugas Prioritas
  let l = act.slice().sort((a, b) => a.date.localeCompare(b.date));
  if (filter === 'urgent') l = l.filter((x) => daysLeft(x.date) <= 3); // Tugas dengan sisa hari <= 3
  if (filter === 'high') l = l.filter((x) => x.prio === 'Tinggi'); // Tugas dengan prioritas tinggi

  // Render HTML daftar list tugas atau pesan kosong jika tidak ada tugas
  $('#list').innerHTML = l.length
    ? l
        .map(
          (x) =>
            `<div class="item">${badge(x)}<span class="n">${esc(x.name)}</span><span>Due: ${fmt(x.date)}</span></div>`,
        )
        .join('')
    : `<div class="empty"><b>${act.length ? 'Tidak ada tugas pada filter ini' : 'Semua tugas selesai'}</b><p>Belum ada tugas baru yang perlu diselesaikan, silahkan tambah tugas baru kapan saja</p><br><a class="btn" href="../tasks/tasks.html">+ Tambah Tugas</a></div>`;

  // 3. Render Daftar Rencana Belajar Harian
  $('#planCount').textContent = `${pl.filter((p) => p.done).length} dari ${pl.length} Selesai`;
  $('#plans').innerHTML = pl
    .map(
      (p) =>
        `<div class="item ${p.done ? 'done' : ''}"><input type="checkbox" style="width:auto" data-id="${p.id}" ${p.done ? 'checked' : ''}><span class="n">${esc(p.name)}</span><span class="tag">${p.min}m</span><button data-del="${p.id}">${svg('x')}</button></div>`,
    )
    .join('');
}

// Event listener: Menangani klik tombol filter kategori prioritas ('Semua', 'Mendesak', 'Prioritas Tinggi')
$('#filters').onclick = (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  filter = b.dataset.f;
  $$('#filters button').forEach((x) => x.classList.toggle('on', x === b));
  render();
};

// Event listener: Menangani pemilihan preset durasi cepat (15, 30, 45, 60, 90 menit)
$('.presets').onclick = (e) => {
  if (e.target.tagName === 'BUTTON') $('#pMin').value = parseInt(e.target.textContent);
};

// Event listener: Menambahkan rencana belajar baru ke dalam daftar
$('#pAdd').onclick = () => {
  const n = $('#pName').value.trim(),
    m = parseInt($('#pMin').value);
  if (!n || !m || m < 1) return alert('Isi nama materi dan durasi (menit).');
  const p = plans();
  p.push({ id: Date.now(), name: n, min: m, done: false, date: iso(new Date()) });
  savePlans(p);
  $('#pName').value = $('#pMin').value = '';
  render();
};

// Event listener: Event delegation untuk menghapus rencana belajar atau mencentang status selesai
$('#plans').onclick = async (e) => {
  const p = plans();
  const delBtn = e.target.closest('button[data-del]');
  const checkInput = e.target.closest('input[data-id]');

  // Kasus A: Klik tombol hapus (icon silang)
  if (delBtn) {
    const delId = delBtn.dataset.del;
    const targetItem = p.find((x) => String(x.id) === String(delId));
    const itemName = targetItem ? `"${targetItem.name}"` : 'rencana ini';

    const ok = await showConfirm({
      title: 'Hapus Rencana Belajar',
      message: `Apakah kamu yakin ingin menghapus ${itemName}?`,
      okText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger'
    });

    if (!ok) return;

    savePlans(p.filter((x) => String(x.id) !== String(delId)));
    render();
  } 
  // Kasus B: Centang checkbox selesai / belum selesai
  else if (checkInput) {
    const item = p.find((x) => String(x.id) === String(checkInput.dataset.id));
    if (item) {
      item.done = checkInput.checked;
      if (item.done && !item.date) {
        item.date = iso(new Date());
      }
      savePlans(p);
      render();
    }
  }
};

// Eksekusi render pertama kali saat file skrip dimuat
render();
