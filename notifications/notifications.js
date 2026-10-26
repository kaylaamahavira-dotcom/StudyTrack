// ==========================================================================
// StudyTrack - Fitur Notifications (fitur/notifications/notifications.js)
// Mengatur: Konfigurasi Saluran Pengingat (Email & WhatsApp), Pemilihan Waktu
// Pengingat Deadline (H-7, H-3, H-1), dan Log Simulasi Pengiriman Otomatis.
// ==========================================================================

/**
 * Fungsi Utama Render Halaman Notifikasi
 * Mengisi nilai input form dari data profil pengguna atau pengaturan tersimpan,
 * mendeteksi status sakelar WhatsApp/Email, serta mensimulasikan pesan notifikasi
 * yang seharusnya terkirim berdasarkan selisih hari tugas aktif.
 */
function render() {
  if (typeof me !== 'function') return;
  const u = me(); // Mengambil data pengguna aktif
  // Ambil data notifikasi tersimpan atau gunakan nilai default
  const n = (typeof notif === 'function' ? notif() : null) || {
    mail: u.email || '',
    wa: u.phone || '',
    onMail: true,
    onWa: false,
    rem: ['7', '3', '1'],
  };

  // 1. Sinkronisasi nilai sakelar toggle dan input field form
  $('#onMail').checked = !!n.onMail;
  $('#mail').value = n.mail || u.email || '';
  $('#onWa').checked = !!n.onWa;
  $('#wa').value = n.wa || u.phone || '';

  // 2. Centang checkbox waktu pengingat (H-7, H-3, H-1) sesuai data tersimpan
  const remList = (n.rem || []).map((x) => String(x));
  $$('.rem').forEach((c) => (c.checked = remList.includes(String(c.value))));

  // 3. Tampilkan label visual status sakelar WhatsApp (Aktif / Nonaktif)
  const waStatusLabel = $('#onWa').checked
    ? '<span style="color:#10b981;font-weight:600;">(Aktif)</span>'
    : '<span style="color:#ef4444;font-weight:600;">(Nonaktif - Pengiriman Stop)</span>';
  const waLabelEl = $('#onWa').closest('.chan')?.querySelector('b');
  if (waLabelEl) {
    waLabelEl.innerHTML = `WhatsApp ${waStatusLabel}`;
  }

  // 4. Simulasi Log Pengiriman Notifikasi
  // Mencocokkan selisih hari deadline tugas aktif dengan opsi H- yang dicentang
  const remDays = $$('.rem:checked').map((c) => parseInt(c.value, 10));
  const t = tasks().filter((x) => !x.done);
  const hits = [];

  t.forEach((x) => {
    const d = daysLeft(x.date);
    // Jika selisih hari tugas tepat jatuh pada salah satu pilihan H- pengingat
    if (remDays.includes(d)) {
      if ($('#onMail').checked && $('#mail').value)
        hits.push({ ch: 'Email', to: $('#mail').value, h: d, task: x.name });
      if ($('#onWa').checked && $('#wa').value)
        hits.push({ ch: 'WhatsApp', to: $('#wa').value, h: d, task: x.name });
    }
  });

  // Render log item simulasi ke dalam panel kanan
  $('#log').innerHTML = hits.length
    ? hits
        .map(
          (h) =>
            `<div class="item"><b>[${h.ch}]</b> <span class="n">${esc(h.task)} (H-${h.h})</span> <small>ke ${esc(h.to)}</small></div>`,
        )
        .join('')
    : '<div class="empty">Tidak ada pengingat yang aktif untuk hari ini.</div>';
}

// Event listener: Mengupdate teks status WhatsApp secara real-time saat sakelar toggle diklik
$('#onWa').onchange = () => {
  const waStatusLabel = $('#onWa').checked
    ? '<span style="color:#10b981;font-weight:600;">(Aktif)</span>'
    : '<span style="color:#ef4444;font-weight:600;">(Nonaktif - Pengiriman Stop)</span>';
  const waLabelEl = $('#onWa').closest('.chan')?.querySelector('b');
  if (waLabelEl) {
    waLabelEl.innerHTML = `WhatsApp ${waStatusLabel}`;
  }
};

// Event listener: Menyimpan seluruh konfigurasi pengaturan notifikasi ke backend/database
$('#save').onclick = () => {
  const rem = $$('.rem:checked').map((c) => c.value);
  const payload = {
    mail: $('#mail').value.trim(),
    wa: $('#wa').value.trim(),
    onMail: $('#onMail').checked,
    onWa: $('#onWa').checked,
    rem,
  };

  api('PUT', '/notif', payload)
    .then(() => {
      if (typeof S !== 'undefined') {
        S.notif = payload; // Perbarui state global
      }
      const msg = payload.onWa
        ? 'Pengaturan berhasil disimpan! Pengingat WhatsApp AKTIF.'
        : 'Pengaturan berhasil disimpan! Pengingat WhatsApp DINONAKTIFKAN.';
      showToast(msg, 'success');
      render();
    })
    .catch((e) => showToast(e.message, 'error'));
};

// Hubungkan render dengan event ready dan eksekusi awal
window.render = render;
window.addEventListener('studytrack:ready', render);
render();
