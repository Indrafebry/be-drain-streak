const db = require('../config/db');

// Menampilkan profil gamifikasi dan statistik
const getProfile = async (req, res) => {
    const userId = req.userId;
    try {
        const profileRes = await db.query(`
            SELECT p.*, u.name, u.email 
            FROM gamification_profiles p
            JOIN users u ON u.id = p.user_id
            WHERE p.user_id = $1
        `, [userId]);

        if (profileRes.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.status(200).json({ profile: profileRes.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Simulasi Middleware / Cron Job (Midnight Checker)
// Endpoint khusus untuk trigger manual (biasanya dipanggil oleh scheduler)
const midnightCheck = async (req, res) => {
    try {
        await db.query('BEGIN');

        // Cari pengguna yang belum aktif sejak kemarin atau lebih lama
        // (last_active_date < CURRENT_DATE)
        const inactiveUsersRes = await db.query(`
            SELECT user_id, current_streak, streak_freeze_count, last_active_date 
            FROM gamification_profiles
            WHERE last_active_date < CURRENT_DATE AND current_streak > 0 FOR UPDATE
        `);

        const logs = [];

        for (let user of inactiveUsersRes.rows) {
            if (user.streak_freeze_count > 0) {
                // Gunakan freeze
                await db.query(`
                    UPDATE gamification_profiles
                    SET streak_freeze_count = streak_freeze_count - 1,
                        last_active_date = CURRENT_DATE -- Pura-pura aktif agar besok bisa berlanjut atau dicek lagi
                    WHERE user_id = $1
                `, [user.user_id]);

                logs.push({
                    user_id: user.user_id,
                    action: 'Streak Protected (Freeze Used)',
                    remaining_freeze: user.streak_freeze_count - 1
                });
            } else {
                // Reset Streak
                await db.query(`
                    UPDATE gamification_profiles
                    SET current_streak = 0
                    WHERE user_id = $1
                `, [user.user_id]);

                logs.push({
                    user_id: user.user_id,
                    action: 'Streak Reset (No Freeze Available)',
                    notification_trigger: 'Comeback Challenge - You lost your streak, let\'s rebuild it!'
                });
            }
        }

        await db.query('COMMIT');

        res.status(200).json({
            message: 'Midnight check completed successfully',
            processed_users: logs.length,
            logs: logs
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Midnight Check Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getProfile,
    midnightCheck
};
