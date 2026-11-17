// middleware/auth.js — Memverifikasi sesi login MySQL
const db = require('../db');

async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.st_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return res.status(401).json({ message: 'Belum login' });
    }

    const [rows] = await db.query(`
      SELECT s.user_id, s.expires_at, u.username, u.email, u.phone, u.role, u.avatar
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > NOW()
    `, [token]);

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: 'Sesi tidak valid atau telah berakhir' });
    }

    const session = rows[0];

    req.user = {
      id: session.user_id,
      username: session.username,
      email: session.email,
      phone: session.phone,
      role: session.role,
      avatar: session.avatar || ''
    };

    next();
  } catch (err) {
    next(err);
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Khusus admin' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly };
