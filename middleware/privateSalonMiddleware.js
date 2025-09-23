const { query } = require('../config/database');

// Middleware to check if salon is private and restrict employee access
const checkPrivateSalon = async (req, res, next) => {
    try {
        const { salonId } = req.params;
        
        if (!salonId) {
            return res.status(400).json({
                success: false,
                message: 'Salon ID talab qilinadi'
            });
        }
        
        // Check if salon exists
        const salonQuery = 'SELECT id FROM salons WHERE id = $1';
        const salonResult = await query(salonQuery, [salonId]);
        
        if (salonResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Salon topilmadi'
            });
        }
        
        // For now, allow access to all salons (private_salon column doesn't exist)
        // if (salonResult.rows[0].private_salon) {
        //     return res.status(403).json({
        //         success: false,
        //         message: 'Private salonda xodimlar bo\'limiga ruxsat yo\'q'
        //     });
        // }
        
        // If not private, continue to next middleware/controller
        next();
    } catch (error) {
        console.error('Error in private salon middleware:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatoligi'
        });
    }
};

module.exports = {
    checkPrivateSalon
};