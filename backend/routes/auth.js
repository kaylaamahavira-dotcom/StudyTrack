// routes/auth.js — Autentikasi dengan MySQL
const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();
const SESSION_DAYS = 7;

async function createSession(userId) {
  const token = uuidv4();
  await db.query(`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ${SESSION_DAYS} DAY))
  `, [token, userId]);

  return token;
}

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, phone } = req.body || {};

    if (!username || !/^[\w.\-]{3,30}$/.test(username)) {
      return res.status(400).json({ message: 'Username 3-30 karakter (huruf, angka, titik, strip, garis bawah).' });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Email tidak valid.' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter.' });
    }

    const [exists] = await db.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (exists.length > 0) {
      return res.status(409).json({ message: 'Username atau email sudah dipakai.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const [result] = await db.query(`
      INSERT INTO users (username, email, phone, password, role)
      VALUES (?, ?, ?, ?, 'user')
    `, [username, email, phone || '', hash]);

    const newUserId = result.insertId;

    await db.query(`
      INSERT INTO notif_settings (user_id, email_enabled, wa_enabled, to_email, reminder_days)
      VALUES (?, 1, 0, ?, '7,3,1')
    `, [newUserId, email]);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const user = users[0];
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const token = await createSession(user.id);

    res.cookie('st_token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: SESSION_DAYS * 86400 * 1000,
    });

    res.json({
      token,
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.st_token;
    if (token) {
      await db.query('DELETE FROM sessions WHERE token = ?', [token]);
    }
    res.clearCookie('st_token');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /auth/reset
router.post('/reset', async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (!users || users.length === 0) {
      return res.status(400).json({ message: 'Username dan email tidak cocok.' });
    }

    const user = users[0];
    if (user.email.toLowerCase() !== String(email || '').trim().toLowerCase()) {
      return res.status(400).json({ message: 'Username dan email tidak cocok.' });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter.' });
    }

    await db.query('UPDATE users SET password = ? WHERE id = ?', [
      bcrypt.hashSync(password, 10),
      user.id
    ]);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
