const db = require('../config/db');
const { processTransactionGamification } = require('../utils/gamifyEngine');

const createTransaction = async (req, res) => {
    const userId = req.userId;
    const { amount, type, category_id, note, date } = req.body;

    if (!amount || !type || !['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: 'Valid amount and type (income/expense) are required' });
    }

    try {
        await db.query('BEGIN');

        // 1. Simpan Transaksi
        const insertTxText = `
            INSERT INTO transactions (user_id, amount, type, category_id, note, date) 
            VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE)) 
            RETURNING *
        `;
        const txRes = await db.query(insertTxText, [userId, amount, type, category_id, note, date]);
        const newTx = txRes.rows[0];

        // 2. Kalkulasi Anggaran (Budget) jika expense
        let budgetAlert = null;
        if (type === 'expense' && category_id) {
            const txDate = newTx.date ? new Date(newTx.date) : new Date();
            const month = txDate.getMonth() + 1;
            const year = txDate.getFullYear();

            // Cek limit budget
            const budgetRes = await db.query(`
                SELECT amount_limit FROM budgets 
                WHERE user_id = $1 AND category_id = $2 AND month = $3 AND year = $4
            `, [userId, category_id, month, year]);

            if (budgetRes.rows.length > 0) {
                const limit = Number(budgetRes.rows[0].amount_limit);
                
                // Hitung total pengeluaran kategori ini di bulan yang sama
                const totalExpenseRes = await db.query(`
                    SELECT SUM(amount) as total FROM transactions
                    WHERE user_id = $1 AND category_id = $2 AND type = 'expense' 
                    AND EXTRACT(MONTH FROM date) = $3 AND EXTRACT(YEAR FROM date) = $4
                `, [userId, category_id, month, year]);

                const totalExpense = Number(totalExpenseRes.rows[0].total) || 0;

                if (totalExpense > limit) {
                    budgetAlert = 'You have exceeded your budget for this category!';
                } else if (totalExpense > limit * 0.8) {
                    budgetAlert = 'You are nearing your budget limit for this category (80%+ used).';
                }
            }
        }

        // 3. Panggil Engine Gamifikasi
        const gamifyReport = await processTransactionGamification(userId, newTx);

        await db.query('COMMIT');

        // 4. Kirim Response JSON
        res.status(201).json({
            message: 'Transaction saved successfully',
            transaction: newTx,
            budget_alert: budgetAlert,
            gamification: gamifyReport
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Create Transaction Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createTransaction
};
