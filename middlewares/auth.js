const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Middleware untuk memverifikasi JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1]; // Format: Bearer <token>
  if (!token) return res.status(403).json({ error: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = decoded.id; // Menyimpan user ID dari token (akan digunakan di controller)
    next();
  });
};

// Rate limiter untuk rute autentikasi (maksimal 10 request per menit)
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 10, // Maksimal 10 request per IP
  message: { error: 'Too many login/register attempts from this IP, please try again after a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  verifyToken,
  authLimiter
};
