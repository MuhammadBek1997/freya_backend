const pool = require('../config/database');
const crypto = require('crypto');
const smsService = require('../services/smsService');

// Encryption key for card numbers (in production, use environment variable)
const ENCRYPTION_KEY = process.env.CARD_ENCRYPTION_KEY || 'your-32-character-secret-key-here';
const ALGORITHM = 'aes-256-cbc';

// Encrypt card number
function encryptCardNumber(cardNumber) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    let encrypted = cipher.update(cardNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

// Decrypt card number
function decryptCardNumber(encryptedCardNumber) {
    const textParts = encryptedCardNumber.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Detect card type based on card number
function detectCardType(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (cleanNumber.startsWith('4')) {
        return 'visa';
    } else if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) {
        return 'mastercard';
    } else if (cleanNumber.startsWith('8600')) {
        return 'uzcard';
    } else if (cleanNumber.startsWith('9860')) {
        return 'humo';
    }
    
    return 'unknown';
}

// Validate card number using Luhn algorithm
function validateCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (!/^\d{13,19}$/.test(cleanNumber)) {
        return false;
    }
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber[i]);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

// Add new payment card
const addPaymentCard = async (req, res) => {
    try {
        const { user_id } = req.user; // From JWT middleware
        const { 
            card_number, 
            card_holder_name, 
            expiry_month, 
            expiry_year, 
            phone_number,
            is_default = false 
        } = req.body;

        // Validate required fields
        if (!card_number || !card_holder_name || !expiry_month || !expiry_year || !phone_number) {
            return res.status(400).json({
                success: false,
                message: 'Barcha maydonlar to\'ldirilishi shart'
            });
        }

        // Validate card number
        if (!validateCardNumber(card_number)) {
            return res.status(400).json({
                success: false,
                message: 'Karta raqami noto\'g\'ri'
            });
        }

        // Validate expiry date
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        if (expiry_year < currentYear || (expiry_year === currentYear && expiry_month < currentMonth)) {
            return res.status(400).json({
                success: false,
                message: 'Karta muddati tugagan'
            });
        }

        // Encrypt card number
        const encryptedCardNumber = encryptCardNumber(card_number);
        const lastFourDigits = card_number.slice(-4);
        const cardType = detectCardType(card_number);

        // If this is set as default, unset other default cards
        if (is_default) {
            await pool.query(
                'UPDATE payment_cards SET is_default = false WHERE user_id = $1',
                [user_id]
            );
        }

        // Insert new card
        const result = await pool.query(`
            INSERT INTO payment_cards (
                user_id, card_number_encrypted, card_holder_name, 
                expiry_month, expiry_year, card_type, phone_number, 
                is_default, last_four_digits
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, card_holder_name, expiry_month, expiry_year, 
                     card_type, phone_number, is_default, last_four_digits, 
                     created_at
        `, [
            user_id, encryptedCardNumber, card_holder_name,
            expiry_month, expiry_year, cardType, phone_number,
            is_default, lastFourDigits
        ]);

        res.status(201).json({
            success: true,
            message: 'Karta muvaffaqiyatli qo\'shildi',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error adding payment card:', error);
        
        if (error.code === '23505') { // Unique constraint violation
            return res.status(400).json({
                success: false,
                message: 'Bu karta allaqachon qo\'shilgan'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Get user's payment cards
const getUserPaymentCards = async (req, res) => {
    try {
        const { user_id } = req.user;

        const result = await pool.query(`
            SELECT id, card_holder_name, expiry_month, expiry_year, 
                   card_type, phone_number, is_default, last_four_digits, 
                   is_active, created_at
            FROM payment_cards 
            WHERE user_id = $1 AND is_active = true
            ORDER BY is_default DESC, created_at DESC
        `, [user_id]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error getting payment cards:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Update payment card
const updatePaymentCard = async (req, res) => {
    try {
        const { user_id } = req.user;
        const { card_id } = req.params;
        const { 
            card_holder_name, 
            expiry_month, 
            expiry_year, 
            phone_number,
            is_default 
        } = req.body;

        // Check if card belongs to user
        const cardCheck = await pool.query(
            'SELECT id FROM payment_cards WHERE id = $1 AND user_id = $2 AND is_active = true',
            [card_id, user_id]
        );

        if (cardCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Karta topilmadi'
            });
        }

        // If setting as default, unset other default cards
        if (is_default) {
            await pool.query(
                'UPDATE payment_cards SET is_default = false WHERE user_id = $1',
                [user_id]
            );
        }

        // Update card
        const result = await pool.query(`
            UPDATE payment_cards 
            SET card_holder_name = COALESCE($1, card_holder_name),
                expiry_month = COALESCE($2, expiry_month),
                expiry_year = COALESCE($3, expiry_year),
                phone_number = COALESCE($4, phone_number),
                is_default = COALESCE($5, is_default),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6 AND user_id = $7
            RETURNING id, card_holder_name, expiry_month, expiry_year, 
                     card_type, phone_number, is_default, last_four_digits, 
                     updated_at
        `, [card_holder_name, expiry_month, expiry_year, phone_number, is_default, card_id, user_id]);

        res.json({
            success: true,
            message: 'Karta ma\'lumotlari yangilandi',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating payment card:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Delete payment card
const deletePaymentCard = async (req, res) => {
    try {
        const { user_id } = req.user;
        const { card_id } = req.params;

        // Check if card belongs to user
        const cardCheck = await pool.query(
            'SELECT id, is_default FROM payment_cards WHERE id = $1 AND user_id = $2 AND is_active = true',
            [card_id, user_id]
        );

        if (cardCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Karta topilmadi'
            });
        }

        // Soft delete the card
        await pool.query(
            'UPDATE payment_cards SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [card_id]
        );

        // If deleted card was default, set another card as default
        if (cardCheck.rows[0].is_default) {
            await pool.query(`
                UPDATE payment_cards 
                SET is_default = true 
                WHERE user_id = $1 AND is_active = true 
                ORDER BY created_at DESC 
                LIMIT 1
            `, [user_id]);
        }

        res.json({
            success: true,
            message: 'Karta o\'chirildi'
        });

    } catch (error) {
        console.error('Error deleting payment card:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Set card as default
const setDefaultCard = async (req, res) => {
    try {
        const { user_id } = req.user;
        const { card_id } = req.params;

        // Check if card belongs to user
        const cardCheck = await pool.query(
            'SELECT id FROM payment_cards WHERE id = $1 AND user_id = $2 AND is_active = true',
            [card_id, user_id]
        );

        if (cardCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Karta topilmadi'
            });
        }

        // Unset all default cards for user
        await pool.query(
            'UPDATE payment_cards SET is_default = false WHERE user_id = $1',
            [user_id]
        );

        // Set selected card as default
        await pool.query(
            'UPDATE payment_cards SET is_default = true WHERE id = $1',
            [card_id]
        );

        res.json({
            success: true,
            message: 'Asosiy karta o\'rnatildi'
        });

    } catch (error) {
        console.error('Error setting default card:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Send SMS verification code for payment card
const sendCardVerificationCode = async (req, res) => {
    try {
        const { user_id } = req.user; // From JWT middleware
        const { card_number, phone_number } = req.body;

        // Validate required fields
        if (!card_number || !phone_number) {
            return res.status(400).json({
                success: false,
                message: 'Karta raqami va telefon raqami talab qilinadi'
            });
        }

        // Validate card number
        if (!validateCardNumber(card_number)) {
            return res.status(400).json({
                success: false,
                message: 'Karta raqami noto\'g\'ri'
            });
        }

        // Generate verification code
        const verificationCode = smsService.generateVerificationCode();
        
        // Send SMS
        const smsResult = await smsService.sendPaymentCardVerificationCode(
            phone_number, 
            card_number, 
            verificationCode
        );

        if (!smsResult.success) {
            return res.status(500).json({
                success: false,
                message: 'SMS yuborishda xatolik yuz berdi'
            });
        }

        // Store verification code temporarily (in production, use Redis or database)
        // For now, we'll store it in memory with expiration
        const verificationKey = `card_verification_${user_id}_${Date.now()}`;
        
        // In a real application, you would store this in Redis with expiration
        // For demo purposes, we'll return the code (remove this in production)
        
        res.status(200).json({
            success: true,
            message: 'Tasdiqlash kodi yuborildi',
            verification_key: verificationKey,
            // Remove this in production:
            verification_code: verificationCode
        });

    } catch (error) {
        console.error('Error sending verification code:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Verify SMS code and add payment card
const verifyAndAddCard = async (req, res) => {
    try {
        const { user_id } = req.user; // From JWT middleware
        const { 
            card_number, 
            card_holder_name, 
            expiry_month, 
            expiry_year, 
            phone_number,
            verification_code,
            verification_key,
            is_default = false 
        } = req.body;

        // Validate required fields
        if (!card_number || !card_holder_name || !expiry_month || !expiry_year || 
            !phone_number || !verification_code || !verification_key) {
            return res.status(400).json({
                success: false,
                message: 'Barcha maydonlar to\'ldirilishi shart'
            });
        }

        // In a real application, verify the code from Redis/database
        // For demo purposes, we'll accept any 6-digit code
        if (!/^\d{6}$/.test(verification_code)) {
            return res.status(400).json({
                success: false,
                message: 'Tasdiqlash kodi noto\'g\'ri'
            });
        }

        // Validate card number
        if (!validateCardNumber(card_number)) {
            return res.status(400).json({
                success: false,
                message: 'Karta raqami noto\'g\'ri'
            });
        }

        // Validate expiry date
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        if (expiry_year < currentYear || (expiry_year === currentYear && expiry_month < currentMonth)) {
            return res.status(400).json({
                success: false,
                message: 'Karta muddati tugagan'
            });
        }

        // Encrypt card number
        const encryptedCardNumber = encryptCardNumber(card_number);
        const lastFourDigits = card_number.slice(-4);
        const cardType = detectCardType(card_number);

        // If this is set as default, unset other default cards
        if (is_default) {
            await pool.query(
                'UPDATE payment_cards SET is_default = false WHERE user_id = $1',
                [user_id]
            );
        }

        // Insert new card
        const result = await pool.query(`
            INSERT INTO payment_cards (
                user_id, card_number_encrypted, card_holder_name, 
                expiry_month, expiry_year, card_type, phone_number, 
                is_default, last_four_digits
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, card_holder_name, expiry_month, expiry_year, 
                     card_type, phone_number, is_default, last_four_digits, 
                     created_at
        `, [
            user_id, encryptedCardNumber, card_holder_name,
            expiry_month, expiry_year, cardType, phone_number,
            is_default, lastFourDigits
        ]);

        res.status(201).json({
            success: true,
            message: 'Karta muvaffaqiyatli qo\'shildi va tasdiqlandi',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error verifying and adding payment card:', error);
        
        if (error.code === '23505') { // Unique constraint violation
            return res.status(400).json({
                success: false,
                message: 'Bu karta allaqachon qo\'shilgan'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Get payment card statistics for mobile dashboard
const getPaymentCardStats = async (req, res) => {
    try {
        const { user_id } = req.user;

        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_cards,
                COUNT(CASE WHEN is_default = true THEN 1 END) as default_cards,
                COUNT(CASE WHEN card_type = 'visa' THEN 1 END) as visa_cards,
                COUNT(CASE WHEN card_type = 'mastercard' THEN 1 END) as mastercard_cards,
                COUNT(CASE WHEN card_type = 'uzcard' THEN 1 END) as uzcard_cards,
                COUNT(CASE WHEN card_type = 'humo' THEN 1 END) as humo_cards
            FROM payment_cards 
            WHERE user_id = $1 AND is_active = true
        `, [user_id]);

        const stats = result.rows[0];

        res.json({
            success: true,
            data: {
                total_cards: parseInt(stats.total_cards),
                has_default_card: parseInt(stats.default_cards) > 0,
                card_types: {
                    visa: parseInt(stats.visa_cards),
                    mastercard: parseInt(stats.mastercard_cards),
                    uzcard: parseInt(stats.uzcard_cards),
                    humo: parseInt(stats.humo_cards)
                }
            }
        });

    } catch (error) {
        console.error('Error getting payment card stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Validate card number for mobile input (real-time validation)
const validateCardForMobile = async (req, res) => {
    try {
        const { card_number } = req.body;

        if (!card_number) {
            return res.status(400).json({
                success: false,
                message: 'Karta raqami kiritilmagan'
            });
        }

        const isValid = validateCardNumber(card_number);
        const cardType = detectCardType(card_number);
        const lastFourDigits = card_number.slice(-4);

        res.json({
            success: true,
            data: {
                is_valid: isValid,
                card_type: cardType,
                last_four_digits: lastFourDigits,
                formatted_number: card_number.replace(/(.{4})/g, '$1 ').trim()
            }
        });

    } catch (error) {
        console.error('Error validating card for mobile:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Get supported card types for mobile app
const getSupportedCardTypes = async (req, res) => {
    try {
        const supportedTypes = [
            {
                type: 'visa',
                name: 'Visa',
                pattern: '^4[0-9]{12}(?:[0-9]{3})?$',
                icon: 'visa-icon',
                color: '#1A1F71'
            },
            {
                type: 'mastercard',
                name: 'Mastercard',
                pattern: '^5[1-5][0-9]{14}$|^2[2-7][0-9]{14}$',
                icon: 'mastercard-icon',
                color: '#EB001B'
            },
            {
                type: 'uzcard',
                name: 'UzCard',
                pattern: '^8600[0-9]{12}$',
                icon: 'uzcard-icon',
                color: '#00A651'
            },
            {
                type: 'humo',
                name: 'Humo',
                pattern: '^9860[0-9]{12}$',
                icon: 'humo-icon',
                color: '#FF6B35'
            }
        ];

        res.json({
            success: true,
            data: supportedTypes
        });

    } catch (error) {
        console.error('Error getting supported card types:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

module.exports = {
    addPaymentCard,
    getUserPaymentCards,
    updatePaymentCard,
    deletePaymentCard,
    setDefaultCard,
    sendCardVerificationCode,
    verifyAndAddCard,
    getPaymentCardStats,
    validateCardForMobile,
    getSupportedCardTypes
};