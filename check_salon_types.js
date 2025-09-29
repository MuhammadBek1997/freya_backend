require('dotenv').config();
const { query } = require('./config/database');

async function checkSalonTypes() {
    try {
        console.log('Checking salons table structure and data...\n');
        
        // First, check the table structure
        const tableStructure = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'salons' 
            ORDER BY ordinal_position
        `);
        
        console.log('Salons table columns:');
        console.log('====================');
        tableStructure.rows.forEach(col => {
            console.log(`${col.column_name}: ${col.data_type}`);
        });
        
        // Check total number of salons
        const totalSalons = await query('SELECT COUNT(*) as count FROM salons');
        console.log(`\nTotal salons in database: ${totalSalons.rows[0].count}`);
        
        // Get all salon records with just basic info
        const allSalons = await query(`
            SELECT id, salon_name, salon_types 
            FROM salons 
            ORDER BY id
        `);
        
        console.log('\nAll salon records:');
        console.log('==================');
        
        const salonTypesFound = new Set();
        
        allSalons.rows.forEach((salon, index) => {
            console.log(`${index + 1}. ID: ${salon.id}`);
            console.log(`   Name: ${salon.salon_name || 'N/A'}`);
            
            // Handle salon_types carefully
            let typesDisplay = 'N/A';
            if (salon.salon_types) {
                try {
                    if (typeof salon.salon_types === 'string') {
                        // If it's a string, try to parse it
                        const parsed = JSON.parse(salon.salon_types);
                        typesDisplay = JSON.stringify(parsed);
                        if (Array.isArray(parsed)) {
                            parsed.forEach(type => salonTypesFound.add(type));
                        } else {
                            salonTypesFound.add(parsed);
                        }
                    } else {
                        // If it's already an object
                        typesDisplay = JSON.stringify(salon.salon_types);
                        if (Array.isArray(salon.salon_types)) {
                            salon.salon_types.forEach(type => salonTypesFound.add(type));
                        } else {
                            salonTypesFound.add(salon.salon_types);
                        }
                    }
                } catch (e) {
                    typesDisplay = `Raw value: ${salon.salon_types}`;
                    // Try to add the raw value too
                    salonTypesFound.add(salon.salon_types);
                }
            }
            
            console.log(`   Types: ${typesDisplay}`);
            console.log('   ---');
        });
        
        console.log('\nUnique salon types found:');
        console.log('========================');
        if (salonTypesFound.size > 0) {
            Array.from(salonTypesFound).forEach((type, index) => {
                console.log(`${index + 1}. "${type}"`);
            });
        } else {
            console.log('No salon types found');
        }
        
    } catch (error) {
        console.error('Error checking salon types:', error);
    } finally {
        process.exit(0);
    }
}

checkSalonTypes();