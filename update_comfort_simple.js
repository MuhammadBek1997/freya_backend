const pool = require('./config/database');

async function updateComfort() {
  try {
    const defaultComfort = [
      {name: 'wifi', isActive: true},
      {name: 'parking', isActive: true}, 
      {name: 'kids', isActive: true},
      {name: 'music', isActive: true},
      {name: 'coffee', isActive: true}
    ];

    const result = await pool.query(
      'UPDATE salons SET salon_comfort = $1',
      [JSON.stringify(defaultComfort)]
    );

    console.log('✅ ' + result.rowCount + ' ta salon yangilandi');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
    process.exit(1);
  }
}

updateComfort();