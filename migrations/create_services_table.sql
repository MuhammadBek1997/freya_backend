-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER DEFAULT 60, -- Duration in minutes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_salon_id ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);
CREATE INDEX IF NOT EXISTS idx_services_title ON services(title);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at);

-- Add some sample services
INSERT INTO services (name, title, description, price, duration) VALUES
('Soch kesish', 'Professional soch kesish', 'Zamonaviy uslubda soch kesish xizmati', 50000, 45),
('Manikür', 'Klassik manikür', 'To\'liq manikür xizmati tirnoq bo\'yash bilan', 30000, 60),
('Pedikür', 'Klassik pedikür', 'To\'liq pedikür xizmati tirnoq bo\'yash bilan', 40000, 90),
('Soch bo\'yash', 'Professional soch bo\'yash', 'Yuqori sifatli bo\'yoq bilan soch bo\'yash', 80000, 120),
('Yuz tozalash', 'Chuqur yuz tozalash', 'Professional kosmetik yuz tozalash', 60000, 75),
('Massaj', 'Relaks massaj', 'To\'liq tana massaji', 100000, 90),
('Kirpik uzaytirish', 'Klassik kirpik uzaytirish', 'Tabiiy ko\'rinishda kirpik uzaytirish', 70000, 120),
('Qosh shakllantirish', 'Professional qosh shakllantirish', 'Qosh shakllantirish va bo\'yash', 25000, 30)
ON CONFLICT DO NOTHING;