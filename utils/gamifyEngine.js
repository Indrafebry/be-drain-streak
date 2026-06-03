const db = require('../config/db');

/**
 * Menghitung dan menyimpan progress gamifikasi pengguna (XP, Level, Streak, Misi).
 * 
 * @param {string} userId - UUID Pengguna
 * @param {object} transactionData - Objek transaksi { amount, type, category_id, date }
 * @returns {object} - Laporan gamifikasi (xp_gained, level_up_occurred, streak_count, missions_updated)
 */
async function processTransactionGamification(userId, transactionData) {
    const report = {
        xp_gained: 0,
        level_up_occurred: false,
        streak_count: 0,
        missions_updated: []
    };

    // 1. Dapatkan Profil Gamifikasi Saat Ini
    const profileRes = await db.query('SELECT * FROM gamification_profiles WHERE user_id = $1', [userId]);
    if (profileRes.rows.length === 0) return report; 

    let profile = profileRes.rows[0];

    // 2. Logika Daily Streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActiveDate = new Date(profile.last_active_date);
    lastActiveDate.setHours(0, 0, 0, 0);

    const diffTime = today - lastActiveDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let newStreak = profile.current_streak;

    if (diffDays === 1) {
        // Kemarin aktif, tambah streak
        newStreak += 1;
    } else if (diffDays > 1) {
        // Streak putus, set ke 1 (hari pertama lagi)
        // (Logika perlindungan Streak Freeze terjadi di endpoint scheduler midnight-check)
        newStreak = 1;
    }
    // Jika diffDays === 0 (hari ini), streak tetap dan tidak bertambah

    const newLongestStreak = Math.max(profile.longest_streak, newStreak);

    // 3. Kalkulasi XP dan Naik Level
    const xpGained = 10; // +10 XP setiap kali transaksi masuk
    let newXpTotal = profile.xp_total + xpGained;
    let newLevel = profile.level;
    let levelUpOccurred = false;

    // Kalkulasi level: XP_required = level * 200
    while (true) {
        const xpRequired = newLevel * 200;
        if (newXpTotal >= xpRequired) {
            newLevel += 1;
            levelUpOccurred = true;
        } else {
            break;
        }
    }

    // Update Profile Gamifikasi di Database
    await db.query(`
        UPDATE gamification_profiles 
        SET current_streak = $1, longest_streak = $2, xp_total = $3, level = $4, last_active_date = CURRENT_DATE
        WHERE user_id = $5
    `, [newStreak, newLongestStreak, newXpTotal, newLevel, userId]);

    report.xp_gained = xpGained;
    report.level_up_occurred = levelUpOccurred;
    report.streak_count = newStreak;

    // 4. Update Progres Misi Harian
    const missionsRes = await db.query(`
        SELECT * FROM daily_missions 
        WHERE user_id = $1 AND completed = false AND date = CURRENT_DATE
    `, [userId]);

    for (let mission of missionsRes.rows) {
        let isUpdated = false;
        let newCurrent = mission.current;

        // Ambil nama kategori untuk pengecekan tipe food_tx
        let categoryName = '';
        if (transactionData.category_id) {
            const catRes = await db.query('SELECT name FROM categories WHERE id = $1', [transactionData.category_id]);
            if (catRes.rows.length > 0) categoryName = catRes.rows[0].name.toLowerCase();
        }

        // Cek tipe misi
        if (mission.type === 'any_tx') {
            newCurrent += 1;
            isUpdated = true;
        } else if (mission.type === 'food_tx' && (categoryName.includes('makan') || categoryName.includes('food') || categoryName.includes('minum'))) {
            newCurrent += 1;
            isUpdated = true;
        } else if (mission.type === 'total_amount' && transactionData.type === 'expense') {
            newCurrent += Number(transactionData.amount);
            isUpdated = true;
        }

        if (isUpdated) {
            let isCompleted = false;
            let earnedCoins = 0;
            let earnedXp = 0;

            if (newCurrent >= mission.target) {
                newCurrent = mission.target; // Maksimal batas
                isCompleted = true;
                earnedCoins = mission.coin_reward;
                earnedXp = mission.xp_reward;
                
                // Berikan Coin dan XP bonus ke profil user
                await db.query(`
                    UPDATE gamification_profiles
                    SET drain_coins = drain_coins + $1, xp_total = xp_total + $2
                    WHERE user_id = $3
                `, [earnedCoins, earnedXp, userId]);
            }

            // Simpan progres misi terbaru
            await db.query(`
                UPDATE daily_missions
                SET current = $1, completed = $2
                WHERE id = $3
            `, [newCurrent, isCompleted, mission.id]);

            report.missions_updated.push({
                mission_id: mission.id,
                type: mission.type,
                completed: isCompleted,
                reward_coins_earned: earnedCoins,
                reward_xp_earned: earnedXp
            });
        }
    }

    return report;
}

module.exports = {
    processTransactionGamification
};
