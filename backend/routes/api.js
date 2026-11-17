
// routes/api.js — User, Tasks, Plans, Settings & Notifications (MySQL)

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { syncNotificationsForUser } = require('../services/notificationService');
const { processWaNotifications } = require('../services/notifScheduler');
const { sendWhatsApp } = require('../services/fonnteService');

const router = express.Router();

router.use(authMiddleware);

// =========================================================
// GET /bootstrap
// Mengambil data awal pengguna, tugas, rencana, dan notifikasi
// =========================================================

router.get('/bootstrap', async (req, res, next) => {
  try {
    const user = req.user;

    const [tasks] = await db.query(
      'SELECT id, name, course, date, prio, notes, done FROM tasks WHERE user_id = ?',
      [user.id]
    );

    const [plans] = await db.query(
      'SELECT id, name, min, done, date FROM plans WHERE user_id = ?',
      [user.id]
    );

    const [notifRows] = await db.query(
      'SELECT * FROM notif_settings WHERE user_id = ?',
      [user.id]
    );

    const notifRaw = notifRows[0] || null;

    const notif = notifRaw ? {
      mail: notifRaw.to_email || '',
      wa: notifRaw.to_phone || '',
      onMail: !!notifRaw.email_enabled,
      onWa: !!notifRaw.wa_enabled,
      rem: notifRaw.reminder_days
        ? notifRaw.reminder_days.split(',')
        : ['7', '3', '1']
    } : null;

    res.json({
      user,
      tasks: tasks.map(t => ({
        ...t,
        done: !!t.done
      })),
      plans: plans.map(p => ({
        ...p,
        done: !!p.done
      })),
      notif
    });

  } catch (err) {
    next(err);
  }
});

// =========================================================
// GET /me
// Mengambil profil pengguna
// =========================================================

router.get('/me', (req, res) => {
  res.json(req.user);
});

// =========================================================
// PUT /me
// Memperbarui profil pengguna
// =========================================================

router.put('/me', async (req, res, next) => {
  try {
    const { username, password, avatar } = req.body || {};
    const current = req.user;

    if (username !== undefined && username !== current.username) {

      if (typeof username !== 'string' || !/^[\w.-]{3,30}$/.test(username)) {
        return res.status(400).json({
          message: 'Username 3-30 karakter (huruf, angka, titik, strip, garis bawah).'
        });
      }

      const [exists] = await db.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, current.id]
      );

      if (exists.length > 0) {
        return res.status(409).json({
          message: 'Username sudah dipakai.'
        });
      }

      await db.query(
        'UPDATE users SET username = ? WHERE id = ?',
        [username, current.id]
      );

      current.username = username;
    }

    if (password) {
      if (String(password).length < 6) {
        return res.status(400).json({
          message: 'Password minimal 6 karakter.'
        });
      }

      await db.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [bcrypt.hashSync(password, 10), current.id]
      );
    }

    if (avatar !== undefined) {
      await db.query(
        'UPDATE users SET avatar = ? WHERE id = ?',
        [avatar, current.id]
      );

      current.avatar = avatar;
    }

    res.json(current);

  } catch (err) {
    next(err);
  }
});

// =========================================================
// PUT /tasks
// Memperbarui daftar tugas pengguna
// =========================================================

router.put('/tasks', async (req, res, next) => {
  try {
    const newTasks = Array.isArray(req.body) ? req.body : [];
    const userId = req.user.id;

    await db.query(
      'DELETE FROM tasks WHERE user_id = ?',
      [userId]
    );

    for (let i = 0; i < newTasks.length; i++) {
      const t = newTasks[i];

      await db.query(`
        INSERT INTO tasks
          (user_id, name, course, date, prio, notes, done)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        t.name || 'Tugas',
        t.course || '',
        t.date || new Date().toISOString().slice(0, 10),
        t.prio || 'Sedang',
        t.notes || '',
        t.done ? 1 : 0
      ]);
    }

    await syncNotificationsForUser(userId);

    res.json({
      ok: true
    });

  } catch (err) {
    next(err);
  }
});

// =========================================================
// PUT /plans
// Memperbarui daftar rencana pengguna
// =========================================================

router.put('/plans', async (req, res, next) => {
  try {
    const newPlans = Array.isArray(req.body) ? req.body : [];
    const userId = req.user.id;

    await db.query(
      'DELETE FROM plans WHERE user_id = ?',
      [userId]
    );

    for (let i = 0; i < newPlans.length; i++) {
      const p = newPlans[i];

      await db.query(`
        INSERT INTO plans
          (user_id, name, min, done, date)
        VALUES (?, ?, ?, ?, ?)
      `, [
        userId,
        p.name || 'Rencana',
        p.min || 0,
        p.done ? 1 : 0,
        p.date || new Date().toISOString().slice(0, 10)
      ]);
    }

    res.json({
      ok: true
    });

  } catch (err) {
    next(err);
  }
});

// =========================================================
// PUT /notif
// US-03: Profil dan Preferensi Notifikasi
// Validasi email dan nomor telepon sebelum disimpan
// =========================================================

router.put('/notif', async (req, res, next) => {
  try {
    const b = req.body || {};
    const userId = req.user.id;

    // Memastikan nilai input berupa teks
    if (
      (b.mail !== undefined && typeof b.mail !== 'string') ||
      (b.wa !== undefined && typeof b.wa !== 'string')
    ) {
      return res.status(400).json({
        ok: false,
        message: 'Email dan nomor telepon harus berupa teks.'
      });
    }

    // Mengambil dan membersihkan input
    const mail = (b.mail || '').trim();
    const wa = (b.wa || '').trim();

    // Mengambil status notifikasi
    const onMail = b.onMail === true;
    const onWa = b.onWa === true;

    // -----------------------------------------------------
    // VALIDASI EMAIL
    // Email yang diisi wajib mengandung karakter @
    // -----------------------------------------------------

    if (mail && !mail.includes('@')) {
      return res.status(400).json({
        ok: false,
        message: 'Format email tidak valid. Email harus mengandung karakter @.'
      });
    }

    // -----------------------------------------------------
    // VALIDASI NOMOR TELEPON
    // Nomor telepon hanya boleh berisi angka
    // -----------------------------------------------------

    if (wa && !/^\d+$/.test(wa)) {
      return res.status(400).json({
        ok: false,
        message: 'Nomor telepon tidak valid. Nomor hanya boleh berisi angka.'
      });
    }

    // -----------------------------------------------------
    // VALIDASI EMAIL WAJIB DIISI JIKA NOTIFIKASI AKTIF
    // -----------------------------------------------------

    if (onMail && !mail) {
      return res.status(400).json({
        ok: false,
        message: 'Email wajib diisi jika notifikasi Email diaktifkan.'
      });
    }

    // -----------------------------------------------------
    // VALIDASI NOMOR WAJIB DIISI JIKA WHATSAPP AKTIF
    // -----------------------------------------------------

    if (onWa && !wa) {
      return res.status(400).json({
        ok: false,
        message: 'Nomor telepon wajib diisi jika WhatsApp diaktifkan.'
      });
    }

    // -----------------------------------------------------
    // VALIDASI PILIHAN REMINDER
    // -----------------------------------------------------

    const allowedReminders = ['7', '3', '1'];

    const rem = Array.isArray(b.rem)
      ? b.rem.map(String)
      : ['7', '3', '1'];

    if (!rem.every(day => allowedReminders.includes(day))) {
      return res.status(400).json({
        ok: false,
        message: 'Pilihan pengingat tidak valid.'
      });
    }

    const remStr = rem.join(',');

    // -----------------------------------------------------
    // SIMPAN PREFERENSI KE DATABASE MYSQL
    // -----------------------------------------------------

    await db.query(`
      INSERT INTO notif_settings
        (user_id, email_enabled, wa_enabled, to_email, to_phone, reminder_days)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        email_enabled = VALUES(email_enabled),
        wa_enabled = VALUES(wa_enabled),
        to_email = VALUES(to_email),
        to_phone = VALUES(to_phone),
        reminder_days = VALUES(reminder_days)
    `, [
      userId,
      onMail ? 1 : 0,
      onWa ? 1 : 0,
      mail,
      wa,
      remStr
    ]);

    // Sinkronisasi notifikasi setelah penyimpanan berhasil
    await syncNotificationsForUser(userId);

    res.json({
      ok: true,
      message: 'Preferensi notifikasi berhasil disimpan.'
    });

  } catch (err) {
    next(err);
  }
});

// =========================================================
// ADMIN ENDPOINTS
// =========================================================

// GET /admin/overview
router.get('/admin/overview', adminOnly, async (req, res, next) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, email, phone, role, avatar FROM users'
    );

    const data = [];

    for (const u of users) {
      const [userTasks] = await db.query(
        'SELECT done, prio FROM tasks WHERE user_id = ?',
        [u.id]
      );

      const [planSum] = await db.query(
        'SELECT SUM(min) AS total FROM plans WHERE user_id = ?',
        [u.id]
      );

      data.push({
        id: u.id,
        username: u.username,
        email: u.email,
        phone: u.phone,
        role: u.role,
        avatar: u.avatar || '',
        tasks: userTasks.map(t => ({
          done: !!t.done,
          prio: t.prio
        })),
        mins: planSum[0]?.total || 0
      });
    }

    res.json({
      users: data
    });

  } catch (err) {
    next(err);
  }
});

// GET /admin/notifications
// Menggabungkan log notifikasi Email dan WhatsApp

router.get('/admin/notifications', adminOnly, async (req, res, next) => {
  try {
    const [emails] = await db.query(`
      SELECT
        e.id,
        u.username AS user,
        'Email' AS channel,
        e.to_email AS \`to\`,
        e.task_name AS task,
        e.h_days AS h,
        e.scheduled_date AS date,
        e.status,
        e.note,
        e.sent_at
      FROM email_notifications e
      JOIN users u ON u.id = e.user_id
    `);

    const [was] = await db.query(`
      SELECT
        w.id,
        u.username AS user,
        'WhatsApp' AS channel,
        w.to_phone AS \`to\`,
        w.task_name AS task,
        w.h_days AS h,
        w.scheduled_date AS date,
        w.status,
        w.note,
        w.sent_at
      FROM wa_notifications w
      JOIN users u ON u.id = w.user_id
    `);

    const combined = [...emails, ...was].sort((a, b) =>
      String(b.date).localeCompare(String(a.date))
    );

    res.json({
      items: combined
    });

  } catch (err) {
    next(err);
  }
});

// POST /admin/wa/send-pending
// Memicu pengiriman manual notifikasi WhatsApp tertunda

router.post('/admin/wa/send-pending', adminOnly, async (req, res, next) => {
  try {
    const result = await processWaNotifications();

    res.json({
      success: true,
      message: 'Pemrosesan antrean notifikasi WhatsApp selesai.',
      result
    });

  } catch (err) {
    next(err);
  }
});

// POST /admin/wa/test
// Mengirim pesan uji coba WhatsApp melalui Fonnte

router.post('/admin/wa/test', adminOnly, async (req, res, next) => {
  try {
    const { phone, message } = req.body || {};

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Nomor telepon (phone) dan pesan (message) wajib diisi.'
      });
    }

    const result = await sendWhatsApp(phone, message);

    const status = result.success ? 'Berhasil' : 'Gagal';

    const note = (
      result.detail ||
      (
        result.success
          ? 'Pesan uji coba berhasil terkirim'
          : 'Gagal mengirim pesan uji coba'
      )
    ).slice(0, 255);

    const sentAt = result.success
      ? new Date().toISOString().slice(0, 19).replace('T', ' ')
      : null;

    const schedDate = new Date().toISOString().slice(0, 10);

    // Catat hasil uji coba ke database
    await db.query(`
      INSERT INTO wa_notifications
        (user_id, task_id, to_phone, task_name, h_days, scheduled_date, status, note, sent_at)
      VALUES (?, NULL, ?, ?, 0, ?, ?, ?, ?)
    `, [
      req.user.id,
      phone,
      `[Uji Coba] ${message.slice(0, 50)}...`,
      schedDate,
      status,
      note,
      sentAt
    ]);

    res.json({
      success: result.success,
      detail: result.detail
    });

  } catch (err) {
    next(err);
  }
});

// PUT /admin/users/:id/password
// Mengubah password pengguna oleh admin

router.put('/admin/users/:id/password', adminOnly, async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { password } = req.body || {};

    if (!password || String(password).length < 6) {
      return res.status(400).json({
        message: 'Password minimal 6 karakter.'
      });
    }

    const [users] = await db.query(
      'SELECT id FROM users WHERE id = ?',
      [targetId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: 'Pengguna tidak ditemukan.'
      });
    }

    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [bcrypt.hashSync(password, 10), targetId]
    );

    res.json({
      ok: true
    });

  } catch (err) {
    next(err);
  }
});

// PUT /admin/users/:id/role
// Mengubah role pengguna

router.put('/admin/users/:id/role', adminOnly, async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { role } = req.body || {};

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Role tidak valid.'
      });
    }

    if (targetId === req.user.id) {
      return res.status(400).json({
        message: 'Tidak bisa mengubah akun sendiri.'
      });
    }

    const [users] = await db.query(
      'SELECT id FROM users WHERE id = ?',
      [targetId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: 'Pengguna tidak ditemukan.'
      });
    }

    await db.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, targetId]
    );

    res.json({
      ok: true
    });

  } catch (err) {
    next(err);
  }
});

// DELETE /admin/users/:id
// Menghapus pengguna

router.delete('/admin/users/:id', adminOnly, async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id, 10);

    if (targetId === req.user.id) {
      return res.status(400).json({
        message: 'Tidak bisa menghapus akun sendiri.'
      });
    }

    const [users] = await db.query(
      'SELECT id FROM users WHERE id = ?',
      [targetId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: 'Pengguna tidak ditemukan.'
      });
    }

    await db.query(
      'DELETE FROM users WHERE id = ?',
      [targetId]
    );

    res.json({
      ok: true
    });

  } catch (err) {
    next(err);
  }
});

// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;
