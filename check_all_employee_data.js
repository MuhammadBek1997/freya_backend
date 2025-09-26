const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
  connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkAllEmployeeData() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Connecting to production database...');
    
    // First, get all tables in the database
    console.log('\n📋 Getting all tables in the database...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tables = await client.query(tablesQuery);
    console.log(`Found ${tables.rows.length} tables:`);
    tables.rows.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });
    
    // Check each table for employee-related data
    console.log('\n🔍 Checking each table for employee-related data...\n');
    
    for (const table of tables.rows) {
      const tableName = table.table_name;
      
      try {
        // Get table structure
        const structureQuery = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `;
        
        const structure = await client.query(structureQuery, [tableName]);
        
        // Check if table has employee-related columns
        const hasEmployeeColumns = structure.rows.some(col => 
          col.column_name.toLowerCase().includes('employee') ||
          col.column_name.toLowerCase().includes('staff') ||
          col.column_name.toLowerCase().includes('worker')
        );
        
        // Get row count
        const countQuery = `SELECT COUNT(*) as count FROM "${tableName}"`;
        const countResult = await client.query(countQuery);
        const rowCount = countResult.rows[0].count;
        
        console.log(`📊 Table: ${tableName}`);
        console.log(`   Rows: ${rowCount}`);
        console.log(`   Columns: ${structure.rows.map(col => col.column_name).join(', ')}`);
        
        if (hasEmployeeColumns) {
          console.log(`   🎯 HAS EMPLOYEE-RELATED COLUMNS!`);
        }
        
        // If this is employees table or has employee columns, show sample data
        if (tableName === 'employees' || hasEmployeeColumns || rowCount > 0) {
          if (rowCount > 0) {
            const sampleQuery = `SELECT * FROM "${tableName}" LIMIT 3`;
            const sampleResult = await client.query(sampleQuery);
            
            console.log(`   📝 Sample data (first 3 rows):`);
            sampleResult.rows.forEach((row, index) => {
              console.log(`      Row ${index + 1}:`, JSON.stringify(row, null, 2));
            });
          }
        }
        
        console.log('   ---\n');
        
      } catch (error) {
        console.log(`   ❌ Error checking table ${tableName}: ${error.message}`);
        console.log('   ---\n');
      }
    }
    
    // Specifically check for any tables that might contain login credentials
    console.log('\n🔐 Looking for tables with authentication-related columns...');
    
    const authTablesQuery = `
      SELECT DISTINCT table_name, column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND (
        column_name ILIKE '%password%' OR
        column_name ILIKE '%hash%' OR
        column_name ILIKE '%auth%' OR
        column_name ILIKE '%login%' OR
        column_name ILIKE '%credential%' OR
        column_name ILIKE '%token%'
      )
      ORDER BY table_name, column_name;
    `;
    
    const authTables = await client.query(authTablesQuery);
    
    if (authTables.rows.length > 0) {
      console.log('Found authentication-related columns:');
      authTables.rows.forEach(row => {
        console.log(`  - ${row.table_name}.${row.column_name}`);
      });
    } else {
      console.log('No authentication-related columns found.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
checkAllEmployeeData()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  });