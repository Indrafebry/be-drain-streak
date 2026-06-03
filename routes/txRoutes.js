const express = require('express');
const router = express.Router();
const { createTransaction } = require('../controllers/txController');
const { verifyToken } = require('../middlewares/auth');

// Gunakan JWT Guard untuk semua rute transaksi
router.use(verifyToken);

router.post('/', createTransaction);

module.exports = router;
