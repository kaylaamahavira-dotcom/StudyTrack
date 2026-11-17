// services/notifScheduler.js
// Penjadwal otomatis untuk pemrosesan dan pengiriman notifikasi WhatsApp
const cron = require('node-cron');
const db = require('../db');
const { sendWhatsApp, formatReminderMessage } = require('./fonnteService');

let isProcessing = false;

/**
 * Memproses seluruh antrean notifikasi WhatsApp yang berstatus 'Tertunda'
 * dan jadwal kirimnya sudah tiba (scheduled_date <= CURDATE()).
 * Dapat dipanggil secara otomatis oleh scheduler atau manual oleh admin.
 * @returns {Promise<{total: number, success: number, failed: number, details: Array}>}
 */
async function processWaNotifications() {
  if (isProcessing) {
    console.log('⚠️ [notifScheduler] Pemrosesan antrean WhatsApp sedang berlangsung, lewati proses ini.');
    return {
      total: 0,
      success: 0,
      failed: 0,
      message: 'Pemrosesan antrean sedang berlangsung.',
      details: []
    };
  }

  isProcessing = true;
  const results = [];
  let successCount = 0;
  let failCount = 0;

  try {
    // Ambil semua notifikasi WhatsApp yang tertunda dan tanggal jadwal <= hari ini
    // Serta pastikan pengaturan WA pengguna masih aktif (wa_enabled = 1)
    const [pendingRows] = await db.query(`
      SELECT w.id, w.user_id, w.task_id, w.to_phone, w.task_name, w.h_days, w.scheduled_date,
             t.date AS task_deadline
      FROM wa_notifications w
      JOIN notif_settings ns ON w.user_id = ns.user_id
      LEFT JOIN tasks t ON w.task_id = t.id
      WHERE w.status = 'Tertunda' AND w.scheduled_date <= CURDATE() AND ns.wa_enabled = 1
      ORDER BY w.scheduled_date ASC, w.id ASC
    `);

    if (pendingRows.length === 0) {
      console.log('ℹ️ [notifScheduler] Tidak ada notifikasi WhatsApp tertunda untuk dikirim.');
      return {
        total: 0,
        success: 0,
        failed: 0,
        details: []
      };
    }

    console.log(`🚀 [notifScheduler] Ditemukan ${pendingRows.length} notifikasi WhatsApp yang perlu dikirim.`);

    for (const item of pendingRows) {
      const deadline = item.task_deadline || null;
      const message = formatReminderMessage(item.task_name, item.h_days, deadline);

      console.log(`📤 [notifScheduler] Mengirim notifikasi WA ID ${item.id} ke ${item.to_phone} (Tugas: "${item.task_name}")...`);
      const sendRes = await sendWhatsApp(item.to_phone, message);

      const status = sendRes.success ? 'Berhasil' : 'Gagal';
      const note = (sendRes.detail || (sendRes.success ? 'Pesan berhasil dikirim via Fonnte' : 'Gagal mengirim pesan via Fonnte')).slice(0, 255);

      if (sendRes.success) {
        successCount++;
        await db.query(`
          UPDATE wa_notifications
          SET status = ?, note = ?, sent_at = NOW()
          WHERE id = ?
        `, [status, note, item.id]);
        console.log(`✅ [notifScheduler] Notifikasi ID ${item.id} berhasil dikirim.`);
      } else {
        failCount++;
        await db.query(`
          UPDATE wa_notifications
          SET status = ?, note = ?
          WHERE id = ?
        `, [status, note, item.id]);
        console.error(`❌ [notifScheduler] Notifikasi ID ${item.id} gagal: ${note}`);
      }

      results.push({
        id: item.id,
        task_name: item.task_name,
        to_phone: item.to_phone,
        status,
        note
      });

      // Beri jeda 500ms antar pengiriman untuk menghindari pembatasan rate limit API
      if (pendingRows.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`🏁 [notifScheduler] Selesai: ${pendingRows.length} notifikasi diproses (${successCount} berhasil, ${failCount} gagal).`);
    return {
      total: pendingRows.length,
      success: successCount,
      failed: failCount,
      details: results
    };
  } catch (err) {
    console.error('❌ [notifScheduler] Terjadi kesalahan dalam processWaNotifications:', err);
    throw err;
  } finally {
    isProcessing = false;
  }
}

/**
 * Menjalankan scheduler berbasis cron untuk notifikasi WhatsApp
 */
function startScheduler() {
  const cronExpression = process.env.NOTIF_CRON || '0 * * * *';

  if (!cron.validate(cronExpression)) {
    console.error(`❌ [notifScheduler] Format cron expression tidak valid: "${cronExpression}". Scheduler batal dijalankan.`);
    return null;
  }

  console.log(`⏰ [notifScheduler] Penjadwal notifikasi WhatsApp berjalan dengan jadwal cron: "${cronExpression}"`);

  const task = cron.schedule(cronExpression, async () => {
    console.log('⏰ [notifScheduler] Memulai pengecekan terjadwal notifikasi WhatsApp...');
    try {
      await processWaNotifications();
    } catch (err) {
      console.error('❌ [notifScheduler] Error pada eksekusi berkala:', err.message);
    }
  });

  return task;
}

module.exports = {
  startScheduler,
  processWaNotifications
};
