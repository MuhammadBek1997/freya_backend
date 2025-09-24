const { Client } = require('pg');

// Heroku PostgreSQL connection
const client = new Client({
    connectionString: 'postgres://u82hhsnrq03vdb:p894645a6da7b84f388ce131c8306b8bf2c5c3a5c7b32d2e5cd60987b1c644d1f@c3mvmsjsgbq96j.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/d7cho3buhj3j6g',
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkHerokuStructure() {
    try {
        await client.connect();
        console.log('✅ Heroku PostgreSQL ga ulanish muvaffaqiyatli\n');

        // Barcha jadvallarni ko'rish
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        console.log('📋 MAVJUD JADVALLAR:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Har bir jadval uchun ustunlarni ko'rish
        for (const table of tablesResult.rows) {
            console.log(`\n🔍 ${table.table_name.toUpperCase()} JADVALI STRUKTURASI:`);
            
            const columnsResult = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'public'
                ORDER BY ordinal_position;
            `, [table.table_name]);
            
            columnsResult.rows.forEach(col => {
                const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
                console.log(`   ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await client.end();
        process.exit(0);
    }
}

checkHerokuStructure();