// services/notificationService.js
// Sinkronisasi dan pemrosesan antrean notifikasi email dan WhatsApp (MySQL)
const db = require('../db');

/**
 * Sinkronisasi jadwal notifikasi ke tabel `email_notifications` dan `wa_notifications`
 * berdasarkan tugas-tugas aktif pengguna dan preferensi hari pengingat (H-x).
 */
async function syncNotificationsForUser(userId) {
  try {
    const [notifRows] = await db.query('SELECT * FROM notif_settings WHERE user_id = ?', [userId]);
    if (!notifRows || notifRows.length === 0) return;
    const notif = notifRows[0];

    const [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ? AND done = 0', [userId]);
    const remDays = (notif.reminder_days || '')
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));

    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. Email Notification Sync
    if (notif.email_enabled && notif.to_email) {
      const isEmailValid = /^\S+@\S+\.\S+$/.test(notif.to_email);

      for (const t of tasks) {
        for (const h of remDays) {
          const d = new Date(t.date + 'T00:00');
          d.setDate(d.getDate() - h);
          const schedDate = d.toISOString().slice(0, 10);

          const [existing] = await db.query(`
            SELECT id FROM email_notifications
            WHERE user_id = ? AND task_id = ? AND h_days = ?
          `, [userId, t.id, h]);

          const status = !isEmailValid
            ? 'Tidak Terkirim'
            : schedDate > todayStr
              ? 'Tertunda'
              : 'Berhasil';

          const note = !isEmailValid
            ? 'Alamat email tidak valid'
            : schedDate > todayStr
              ? 'Dijadwalkan'
              : 'Terkirim';

          const sentAt = status === 'Berhasil' ? `${schedDate} 08:00:00` : null;

          if (existing.length > 0) {
            await db.query(`
              UPDATE email_notifications
              SET to_email = ?, task_name = ?, scheduled_date = ?, status = ?, note = ?, sent_at = ?
              WHERE id = ?
            `, [notif.to_email, t.name, schedDate, status, note, sentAt, existing[0].id]);
          } else {
            await db.query(`
              INSERT INTO email_notifications (user_id, task_id, to_email, task_name, h_days, scheduled_date, status, note, sent_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [userId, t.id, notif.to_email, t.name, h, schedDate, status, note, sentAt]);
          }
        }
      }
    }

    // 2. WhatsApp Notification Sync
    if (notif.wa_enabled && notif.to_phone) {
      const isPhoneValid = /^\+?\d{8,15}$/.test(notif.to_phone);

      for (const t of tasks) {
        for (const h of remDays) {
          const d = new Date(t.date + 'T00:00');
          d.setDate(d.getDate() - h);
          const schedDate = d.toISOString().slice(0, 10);

          const [existing] = await db.query(`
            SELECT id, status FROM wa_notifications
            WHERE user_id = ? AND task_id = ? AND h_days = ?
          `, [userId, t.id, h]);

          const status = !isPhoneValid
            ? 'Tidak Terkirim'
            : 'Tertunda';

          const note = !isPhoneValid
            ? 'Nomor WhatsApp tidak valid'
            : schedDate > todayStr
              ? 'Dijadwalkan'
              : 'Menunggu pengiriman';

          const sentAt = null;

          if (existing.length > 0) {
            // Jika sudah terkirim ('Berhasil'), jangan ubah kembali ke 'Tertunda'
            if (existing[0].status === 'Berhasil') {
              await db.query(`
                UPDATE wa_notifications
                SET to_phone = ?, task_name = ?, scheduled_date = ?
                WHERE id = ?
              `, [notif.to_phone, t.name, schedDate, existing[0].id]);
            } else {
              await db.query(`
                UPDATE wa_notifications
                SET to_phone = ?, task_name = ?, scheduled_date = ?, status = ?, note = ?, sent_at = ?
                WHERE id = ?
              `, [notif.to_phone, t.name, schedDate, status, note, sentAt, existing[0].id]);
            }
          } else {
            await db.query(`
              INSERT INTO wa_notifications (user_id, task_id, to_phone, task_name, h_days, scheduled_date, status, note, sent_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [userId, t.id, notif.to_phone, t.name, h, schedDate, status, note, sentAt]);
          }
        }
      }
    } else {
      // Jika toggle WhatsApp OFF atau nomor kosong: batalkan semua notifikasi WhatsApp yang masih berstatus 'Tertunda'
      await db.query(`
        UPDATE wa_notifications
        SET status = 'Tidak Terkirim', note = 'Dinonaktifkan oleh pengguna (Toggle WA OFF)'
        WHERE user_id = ? AND status = 'Tertunda'
      `, [userId]);
    }
  } catch (err) {
    console.error('Error saat sync notifikasi:', err);
  }
}

module.exports = { syncNotificationsForUser };
