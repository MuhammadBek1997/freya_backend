const { pool } = require('./config/database');

async function createPaymentSystem() {
    try {
        console.log('To\'lov tizimi uchun jadvallar yaratilmoqda...');

        // 1. Salons jadvaliga is_top maydoni qo'shish
        await pool.query(`
            ALTER TABLE salons 
            ADD COLUMN IF NOT EXISTS is_top BOOLEAN DEFAULT FALSE;
        `);
        console.log('✅ Salons jadvaliga is_top maydoni qo\'shildi');

        // 2. Payments jadvali yaratish
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
                salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'UZS',
                payment_type VARCHAR(50) NOT NULL, -- 'employee_post', 'user_premium', 'salon_top'
                payment_method VARCHAR(50) DEFAULT 'click',
                transaction_id VARCHAR(255) UNIQUE,
                click_trans_id VARCHAR(255),
                status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Payments jadvali yaratildi');

        // 3. Subscriptions jadvali yaratish (User premium uchun)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL DEFAULT 'premium', -- 'premium', 'vip'
                status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'cancelled'
                start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_date TIMESTAMP NOT NULL,
                payment_id UUID REFERENCES payments(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Subscriptions jadvali yaratildi');

        // 4. Employee post limits jadvali yaratish
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employee_post_limits (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                employee_id UUID REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
                free_posts_used INTEGER DEFAULT 0,
                total_paid_posts INTEGER DEFAULT 0,
                current_period_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Employee post limits jadvali yaratildi');

        // 5. Salon top history jadvali yaratish
        await pool.query(`
            CREATE TABLE IF NOT EXISTS salon_top_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
                admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
                start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_date TIMESTAMP,
                payment_id UUID REFERENCES payments(id),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Salon top history jadvali yaratildi');

        // 6. Mavjud employeelar uchun post limit recordlarini yaratish
        await pool.query(`
            INSERT INTO employee_post_limits (employee_id)
            SELECT id FROM employees 
            WHERE id NOT IN (SELECT employee_id FROM employee_post_limits WHERE employee_id IS NOT NULL);
        `);
        console.log('✅ Mavjud employeelar uchun post limit recordlari yaratildi');

        // 7. Indexlar yaratish
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
            CREATE INDEX IF NOT EXISTS idx_payments_employee_id ON payments(employee_id);
            CREATE INDEX IF NOT EXISTS idx_payments_salon_id ON payments(salon_id);
            CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
            CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
            CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
            CREATE INDEX IF NOT EXISTS idx_salon_top_history_salon_id ON salon_top_history(salon_id);
            CREATE INDEX IF NOT EXISTS idx_salon_top_history_active ON salon_top_history(is_active);
        `);
        console.log('✅ Indexlar yaratildi');

        console.log('\n🎉 To\'lov tizimi muvaffaqiyatli o\'rnatildi!');
        
        // Test ma'lumotlarini ko'rsatish
        const tablesInfo = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('payments', 'subscriptions', 'employee_post_limits', 'salon_top_history')
            ORDER BY table_name;
        `);
        
        console.log('\nYaratilgan jadvallar:');
        console.table(tablesInfo.rows);

        process.exit(0);
    } catch (error) {
        console.error('Xatolik:', error);
        process.exit(1);
    }
}

createPaymentSystem();