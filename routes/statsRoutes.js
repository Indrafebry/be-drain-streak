const express = require('express');
const router = express.Router();
const { getProfile, midnightCheck } = require('../controllers/statsController');
const { verifyToken } = require('../middlewares/auth');

// Profil membutuhkan JWT Guard
router.get('/profile', verifyToken, getProfile);

// Endpoint simulasi midnight check tidak menggunakan verifyToken 
// karena ini seharusnya dipanggil dari background job (scheduler) 
// secara internal/menggunakan Service API Key.
router.post('/midnight-check', midnightCheck);

module.exports = router;
