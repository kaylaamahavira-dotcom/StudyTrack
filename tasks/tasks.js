// ==========================================================================
// StudyTrack - Fitur Tasks (fitur/tasks/tasks.js)
// Mengatur: Manajemen Tugas (CRUD), Filter Berdasarkan Status/Prioritas,
// Pengelompokan Otomatis (Terlambat, Hari ini/Besok, Mendatang, Selesai),
// Pencarian Real-Time, dan Kalkulasi Prioritas Otomatis Berdasarkan Deadline.
// ==========================================================================

// State lokal: Menyimpan filter aktif dan ID tugas yang sedang diedit
let curFilter = 'all',
  editId = null;

/**
 * Fungsi Utama Render Daftar Tugas
 * Menghitung kartu ringkasan (Total, Aktif, Selesai, Terlambat),
 * memfilter tugas berdasarkan input pencarian & filter pills,
 * serta mengelompokkan tugas ke dalam 4 kategori timeline.
 */
function render() {
  if (typeof tasks !== 'function') return;
  const all = tasks(), // Mengambil data array tugas global
    q = ($('#q').value || '').toLowerCase().trim(); // Keyword pencarian
  const open = all.filter((x) => !x.done); // Tugas aktif
  const late = open.filter((x) => daysLeft(x.date) < 0); // Tugas lewat deadline

  // 1. Perbarui nilai angka pada 4 kartu statistik
  $('#tTotal').textContent = all.length;
  $('#tOpen').textContent = open.length;
  $('#tDone').textContent = all.filter((x) => x.done).length;
  $('#tLate').textContent = late.length;

  // 2. Filter data berdasarkan pilihan filter tab
  let filtered = all.filter((x) => {
    if (curFilter === 'open') return !x.done;
    if (curFilter === 'done') return x.done;
    if (curFilter === 'Tinggi') return x.prio === 'Tinggi';
    return true;
  });

  // 3. Filter data berdasarkan keyword pencarian (nama tugas atau matakuliah)
  if (q)
    filtered = filtered.filter((x) =>
      (x.name + ' ' + (x.course || '')).toLowerCase().includes(q),
    );

  // Urutkan tugas berdasarkan tanggal deadline terdekat
  filtered.sort((a, b) => a.date.localeCompare(b.date));

  // 4. Pengelompokan tugas berdasarkan timeline status
  const groups = {
    Terlambat: filtered.filter((x) => !x.done && daysLeft(x.date) < 0),
    'Hari Ini & Besok': filtered.filter(
      (x) => !x.done && daysLeft(x.date) >= 0 && daysLeft(x.date) <= 1,
    ),
    Mendatang: filtered.filter((x) => !x.done && daysLeft(x.date) > 1),
    Selesai: filtered.filter((x) => x.done),
  };

  // 5. Render elemen HTML tugas per kelompok
  let html = '';
  for (const [k, arr] of Object.entries(groups)) {
    if (!arr.length) continue;
    html +=
      `<div class="grp ${k === 'Terlambat' ? 'late' : ''}"><h2>${k} <span>${arr.length}</span></h2><div class="grp-b">` +
      arr
        .map((x) => {
          const dl = daysLeft(x.date);
          const whenTxt = x.done
            ? 'Selesai'
            : dl < 0
              ? `Terlambat ${Math.abs(dl)} hari`
              : dl === 0
                ? 'Hari ini'
                : dl === 1
                  ? 'Besok'
                  : `${dl} hari lagi`;
          return `<div class="tk p-${x.prio} ${x.done ? 'done' : ''} ${editId === x.id ? 'sel' : ''}">
                <input type="checkbox" data-c="${x.id}" ${x.done ? 'checked' : ''}>
                <div class="t"><b>${esc(x.name)}</b><small>${esc(x.course || '-')}${x.notes ? ' · ' + esc(x.notes) : ''}</small></div>
                <div class="when"><em class="${dl < 0 && !x.done ? 'warn' : ''}">${whenTxt}</em><small>${fmt(x.date)}</small></div>
                <div class="act"><button data-e="${x.id}">${svg('edit')}</button><button data-d="${x.id}">${svg('trash')}</button></div>
              </div>`;
        })
        .join('') +
      `</div></div>`;
  }
  $('#list').innerHTML = html || '<div class="emptyx">Tidak ada tugas yang sesuai filter.</div>';
}

// Event listener: Menangani pergantian filter kategori tugas ('Semua', 'Belum Selesai', 'Selesai', 'Prioritas Tinggi')
$('#filters').onclick = (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  curFilter = b.dataset.f;
  $$('#filters button').forEach((x) => x.classList.toggle('on', x === b));
  render();
};

// Event listener: Pencarian real-time saat pengguna mengetik di kolom search
$('#q').oninput = render;

// Sinkronisasi otomatis nilai prioritas saat pengguna memilih tanggal deadline pada form tambah
$('#newForm').d.oninput = (e) => {
  $('#newForm').p.value = calcPrio(e.target.value);
};

// Sinkronisasi otomatis nilai prioritas saat pengguna mengubah tanggal deadline pada form edit
$('#editForm').d.oninput = (e) => {
  $('#editForm').p.value = calcPrio(e.target.value);
};

/**
 * Membuka Modal Popup Tambah Tugas Baru
 * Mengosongkan form dan mengisi default tanggal deadline dengan hari ini
 */
const openModal = () => {
  const form = $('#newForm');
  if (form) {
    form.reset();
    const today = iso(new Date());
    if (form.d) form.d.value = today;
    if (form.p) form.p.value = calcPrio(today);
  }
  const modal = $('#modal');
  if (modal) {
    modal.removeAttribute('hidden');
    modal.hidden = false;
    modal.style.display = 'grid';
  }
};

/**
 * Menutup Modal Popup Tambah Tugas Baru
 */
const closeModal = () => {
  const modal = $('#modal');
  if (modal) {
    modal.setAttribute('hidden', '');
    modal.hidden = true;
    modal.style.display = 'none';
  }
};

const newBtn = $('#newBtn');
if (newBtn) {
  newBtn.onclick = openModal;
}

const modalClose = $('#modalClose');
if (modalClose) {
  modalClose.onclick = closeModal;
}

// Tutup modal jika pengguna mengklik area backdrop di luar box form
const modalEl = $('#modal');
if (modalEl) {
  modalEl.onclick = (e) => {
    if (e.target === modalEl) closeModal();
  };
}

// Handler Submit: Menyimpan Tugas Baru ke Database
$('#newForm').onsubmit = (e) => {
  e.preventDefault();
  const f = e.target,
    t = tasks();
  // Prioritas 100% otomatis dihitung dari deadline:
  // ≤ 3 hari (termasuk hari ini / terlewat) = Tinggi
  // 4 - 6 hari = Sedang
  // ≥ 7 hari = Rendah
  t.push({
    id: Date.now(),
    name: f.n.value.trim(),
    course: f.c.value.trim(),
    date: f.d.value,
    prio: calcPrio(f.d.value),
    notes: f.m.value.trim(),
    done: false,
  });
  saveTasks(t);
  closeModal();
  render();
};

// Event delegation pada list tugas: Toggle status checklist, Tombol Edit, dan Tombol Hapus
$('#list').onclick = async (e) => {
  const t = tasks();

  // Aksi 1: Centang status tugas selesai / belum selesai
  if (e.target.dataset.c) {
    const item = t.find((x) => x.id == e.target.dataset.c);
    if (item) item.done = e.target.checked;
    saveTasks(t);
    render();
  } 
  // Aksi 2: Buka panel form edit tugas
  else if (e.target.closest('button[data-e]')) {
    const id = e.target.closest('button[data-e]').dataset.e;
    openEdit(id);
  } 
  // Aksi 3: Hapus tugas dengan dialog konfirmasi
  else if (e.target.closest('button[data-d]')) {
    const id = e.target.closest('button[data-d]').dataset.d;
    const taskItem = t.find((x) => String(x.id) === String(id));
    const taskName = taskItem ? `"${taskItem.name}"` : 'tugas ini';

    const ok = await showConfirm({
      title: 'Hapus Tugas',
      message: `Apakah Anda yakin ingin menghapus ${taskName}? Tindakan ini tidak dapat dibatalkan.`,
      okText: 'Ya, Hapus Tugas',
      cancelText: 'Batal',
      type: 'danger'
    });

    if (ok) {
      saveTasks(t.filter((x) => String(x.id) !== String(id)));
      if (editId == id) closeEdit();
      render();
    }
  }
};

/**
 * Menampilkan panel form edit samping dan mengisi data tugas yang dipilih
 * @param {string|number} id - ID tugas yang diedit
 */
function openEdit(id) {
  const item = tasks().find((x) => x.id == id);
  if (!item) return;
  editId = id;
  const f = $('#editForm');
  f.n.value = item.name;
  f.c.value = item.course || '';
  f.d.value = item.date;
  f.p.value = item.prio || calcPrio(item.date);
  f.m.value = item.notes || '';
  $('#layout').classList.add('editing');
  render();
}

/**
 * Menutup panel form edit tugas samping
 */
function closeEdit() {
  editId = null;
  $('#layout').classList.remove('editing');
  render();
}

$('#fClose').onclick = closeEdit;

// Handler Submit: Menyimpan hasil perubahan tugas yang diedit
$('#editForm').onsubmit = (e) => {
  e.preventDefault();
  const f = e.target,
    t = tasks();
  const item = t.find((x) => x.id == editId);
  if (item) {
    item.name = f.n.value.trim();
    item.course = f.c.value.trim();
    item.date = f.d.value;
    item.prio = calcPrio(f.d.value); // Otomatis diperbarui berdasarkan deadline baru
    item.notes = f.m.value.trim();
    saveTasks(t);
  }
  closeEdit();
};

// Ekspos fungsi render ke global scope agar dapat dipanggil ulang saat state siap
window.render = render;
window.addEventListener('studytrack:ready', render);
render();
