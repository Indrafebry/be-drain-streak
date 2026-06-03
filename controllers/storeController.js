const db = require('../config/db');

const buyItem = async (req, res) => {
    const userId = req.userId;
    const { item_type } = req.body;

    if (item_type !== 'freeze') {
        return res.status(400).json({ error: 'Invalid item type. Available types: freeze' });
    }

    try {
        await db.query('BEGIN');

        // 1. Ambil profil user dan lock row (FOR UPDATE)
        const profileRes = await db.query('SELECT drain_coins, streak_freeze_count FROM gamification_profiles WHERE user_id = $1 FOR UPDATE', [userId]);
        
        if (profileRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Gamification profile not found' });
        }

        const profile = profileRes.rows[0];
        const FREEZE_PRICE = 20;

        // 2. Validasi koin cukup
        if (profile.drain_coins < FREEZE_PRICE) {
            await db.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient DrainCoins' });
        }

        // 3. Proses Pembelian
        await db.query(`
            UPDATE gamification_profiles 
            SET drain_coins = drain_coins - $1, streak_freeze_count = streak_freeze_count + 1 
            WHERE user_id = $2
        `, [FREEZE_PRICE, userId]);

        await db.query('COMMIT');

        res.status(200).json({
            message: 'Streak Freeze purchased successfully!',
            new_balance: profile.drain_coins - FREEZE_PRICE,
            new_freeze_count: profile.streak_freeze_count + 1
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Store Buy Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    buyItem
};
