// services/fonnteService.js
// Layanan integrasi WhatsApp Gateway menggunakan Fonnte API

/**
 * Mengirim pesan WhatsApp melalui Fonnte API
 * @param {string} phone - Nomor tujuan (misal: 08123456789 atau 628123456789)
 * @param {string} message - Isi pesan teks yang akan dikirim
 * @returns {Promise<{success: boolean, detail: string}>} Hasil pengiriman
 */
async function sendWhatsApp(phone, message) {
  const token = process.env.FONNTE_TOKEN;

  if (!token) {
    console.warn('⚠️ [Fonnte] FONNTE_TOKEN belum dikonfigurasi di file .env');
    return {
      success: false,
      detail: 'FONNTE_TOKEN belum dikonfigurasi di file .env'
    };
  }

  if (!phone || !message) {
    return {
      success: false,
      detail: 'Nomor telepon tujuan dan pesan tidak boleh kosong'
    };
  }

  try {
    // Normalisasi nomor telepon: hapus spasi dan tanda minus
    let cleanPhone = String(phone).trim().replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.slice(1);
    }

    const params = new URLSearchParams();
    params.append('target', cleanPhone);
    params.append('message', message);
    params.append('countryCode', '62');

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json().catch(() => null);

    if (!data) {
      return {
        success: false,
        detail: `Gagal mengurai respons dari server Fonnte (HTTP ${response.status})`
      };
    }

    // Fonnte mengembalikan status (boolean) dan detail / reason
    const isSuccess = Boolean(data.status);
    const detailMsg = data.detail || data.reason || (isSuccess ? 'Pesan berhasil dikirim' : 'Gagal mengirim pesan');

    return {
      success: isSuccess,
      detail: detailMsg
    };
  } catch (err) {
    console.error('❌ [Fonnte] Terjadi kesalahan saat mengirim pesan WhatsApp:', err.message);
    return {
      success: false,
      detail: err.message || 'Terjadi kesalahan jaringan saat menghubungi Fonnte'
    };
  }
}

/**
 * Membuat format pesan pengingat tugas StudyTrack yang ramah dalam bahasa Indonesia
 * @param {string} taskName - Nama tugas yang harus diselesaikan
 * @param {number|string} daysLeft - Sisa hari hingga batas waktu (H-x)
 * @param {string} [deadline] - Tanggal batas waktu (opsional)
 * @returns {string} Format teks pesan WhatsApp
 */
function formatReminderMessage(taskName, daysLeft, deadline) {
  const h = parseInt(daysLeft, 10);
  let sisaHariText = '';

  if (isNaN(h) || h === 0) {
    sisaHariText = '🚨 *Hari ini adalah batas waktu pengumpulan tugas!*';
  } else if (h === 1) {
    sisaHariText = '⏳ *Besok adalah batas waktu pengumpulan (H-1)!*';
  } else if (h > 1) {
    sisaHariText = `⏳ *Tersisa ${h} hari lagi menuju tenggat waktu (H-${h})!*`;
  } else {
    sisaHariText = `📌 *Pengingat tugas StudyTrack (H${h})*`;
  }

  let deadlineText = '';
  if (deadline) {
    deadlineText = `\n📅 *Batas Waktu:* ${deadline}`;
  }

  return `Halo! 👋\n` +
    `Ini adalah pengingat otomatis dari *StudyTrack*.\n\n` +
    `📋 *Tugas:* ${taskName}${deadlineText}\n` +
    `${sisaHariText}\n\n` +
    `Yuk segera cek dan selesaikan tugasmu tepat waktu. Tetap semangat belajar! 💪✨\n\n` +
    `_Pesan otomatis ini dikirimkan oleh sistem StudyTrack._`;
}

module.exports = {
  sendWhatsApp,
  formatReminderMessage
};
