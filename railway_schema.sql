
-- Freya Salon Database Schema
-- Railway PostgreSQL uchun

CREATE TABLE IF NOT EXISTS salons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    district VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test ma'lumotlari qo'shish
INSERT INTO salons (name, address, city, district, phone, email, description) VALUES
('Freya Beauty Salon', 'Amir Temur ko'chasi 15', 'Toshkent', 'Yunusobod', '+998901234567', 'info@freyasalon.uz', 'Zamonaviy go'zallik saloni'),
('Elite Beauty Center', 'Mustaqillik ko'chasi 25', 'Toshkent', 'Mirobod', '+998901234568', 'elite@beauty.uz', 'Premium go'zallik markazi'),
('Luxury Spa Salon', 'Bobur ko'chasi 10', 'Toshkent', 'Shayxontohur', '+998901234569', 'luxury@spa.uz', 'Hashamatli spa salon'),
('Modern Beauty Studio', 'Navoi ko'chasi 30', 'Toshkent', 'Olmazor', '+998901234570', 'modern@studio.uz', 'Zamonaviy go'zallik studiyasi'),
('Royal Beauty Palace', 'Abdulla Qodiriy ko'chasi 5', 'Toshkent', 'Yakkasaroy', '+998901234571', 'royal@palace.uz', 'Qirollik go'zallik saroyi');

-- Indekslar yaratish
CREATE INDEX IF NOT EXISTS idx_salons_city ON salons(city);
CREATE INDEX IF NOT EXISTS idx_salons_district ON salons(district);
CREATE INDEX IF NOT EXISTS idx_salons_name ON salons(name);
