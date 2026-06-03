const express = require('express');
const router = express.Router();
const { buyItem } = require('../controllers/storeController');
const { verifyToken } = require('../middlewares/auth');

// Gunakan JWT Guard
router.use(verifyToken);

router.post('/buy', buyItem);

module.exports = router;
