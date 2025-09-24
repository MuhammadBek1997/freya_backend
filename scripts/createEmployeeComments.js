const { pool } = require('../config/database');

const createEmployeeCommentsTable = async () => {
    try {
        console.log('Employee comments jadvalini yaratyapman...');
        
        // Employee comments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employee_comments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('✅ Employee comments jadvali yaratildi!');
        
        // Employee posts table ham yaratamiz
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employee_posts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                image_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('✅ Employee posts jadvali yaratildi!');
        
        // Indekslar yaratish
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_employee_comments_employee_id ON employee_comments(employee_id);
            CREATE INDEX IF NOT EXISTS idx_employee_posts_employee_id ON employee_posts(employee_id);
        `);
        
        console.log('✅ Indekslar yaratildi!');
        
        // Jadvallar ro'yxatini ko'rish
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%employee%'
            ORDER BY table_name;
        `);
        
        console.log('📋 Employee bilan bog\'liq jadvallar:');
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
    } catch (error) {
        console.error('❌ Jadval yaratishda xatolik:', error);
    } finally {
        await pool.end();
    }
};

createEmployeeCommentsTable();