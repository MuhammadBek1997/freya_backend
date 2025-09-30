const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkAdminsStructure() {
    try {
        console.log('🔍 Admins jadvali strukturasini tekshirish...\n');
        
        // Admins jadvalining strukturasini ko'rish
        const structureQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'admins' 
            ORDER BY ordinal_position;
        `;
        
        const structureResult = await pool.query(structureQuery);
        console.log('📋 Admins jadvali strukturasi:');
        console.log('='.repeat(60));
        structureResult.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        console.log('');
        
        // Barcha adminlarni ko'rish
        const adminsQuery = `SELECT * FROM admins ORDER BY username;`;
        const adminsResult = await pool.query(adminsQuery);
        
        console.log('👥 Mavjud adminlar:');
        console.log('='.repeat(60));
        
        if (adminsResult.rows.length === 0) {
            console.log('❌ Hech qanday admin topilmadi!');
        } else {
            adminsResult.rows.forEach((admin, index) => {
                console.log(`${index + 1}. Admin ma'lumotlari:`);
                Object.keys(admin).forEach(key => {
                    let value = admin[key];
                    if (key.includes('password') && value) {
                        value = value.substring(0, 20) + '...';
                    }
                    console.log(`   ${key}: ${value}`);
                });
                console.log('');
            });
        }
        
        // Employees jadvalini ham tekshirish (admin sifatida ishlatilishi mumkin)
        console.log('🔍 Employees jadvalini tekshirish...\n');
        
        const employeesStructureQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            ORDER BY ordinal_position;
        `;
        
        const employeesStructureResult = await pool.query(employeesStructureQuery);
        console.log('📋 Employees jadvali strukturasi:');
        console.log('='.repeat(60));
        employeesStructureResult.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        console.log('');
        
        // Employees dan admin rolini tekshirish
        const employeesQuery = `
            SELECT id, username, password_hash, role, salon_id, created_at
            FROM employees 
            WHERE role = 'admin' OR role LIKE '%admin%'
            ORDER BY username;
        `;
        
        try {
            const employeesResult = await pool.query(employeesQuery);
            console.log('👥 Admin rolidagi employees:');
            console.log('='.repeat(60));
            
            if (employeesResult.rows.length === 0) {
                console.log('❌ Admin rolidagi employee topilmadi!');
            } else {
                employeesResult.rows.forEach((employee, index) => {
                    console.log(`${index + 1}. Employee-Admin:`);
                    console.log(`   Username: ${employee.username}`);
                    console.log(`   Role: ${employee.role}`);
                    console.log(`   Salon ID: ${employee.salon_id}`);
                    console.log(`   Password hash: ${employee.password_hash ? employee.password_hash.substring(0, 20) + '...' : 'null'}`);
                    console.log(`   Created: ${employee.created_at}`);
                    console.log('');
                });
            }
        } catch (empError) {
            console.log('❌ Employees jadvalida xatolik:', empError.message);
        }
        
    } catch (error) {
        console.error('❌ Xatolik yuz berdi:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await pool.end();
    }
}

checkAdminsStructure();