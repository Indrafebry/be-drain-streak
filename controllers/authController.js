const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Registrasi
const register = async (req, res) => {
    const { email, password, name, timezone } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    try {
        // Cek apakah user sudah ada
        const userExist = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Mulai DB Transaction
        await db.query('BEGIN');

        // Insert User
        const insertUserText = `
            INSERT INTO users (email, password_hash, name, timezone) 
            VALUES ($1, $2, $3, $4) RETURNING id, email, name, timezone
        `;
        const userRes = await db.query(insertUserText, [email, password_hash, name, timezone || 'Asia/Jakarta']);
        const newUser = userRes.rows[0];

        // Buat profil gamifikasi default
        await db.query(`
            INSERT INTO gamification_profiles (user_id) VALUES ($1)
        `, [newUser.id]);

        // Buat beberapa kategori default khusus pengguna ini, jika perlu (atau biarkan default global = NULL user_id)
        
        await db.query('COMMIT');

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Register Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Login
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Cari User
        const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = userRes.rows[0];

        // Validasi Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'secretfallback',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    register,
    login
};
