-- Freya Backend Database Schema

-- Create database (run this manually in PostgreSQL)
-- CREATE DATABASE freya_db;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (for mobile app)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content table
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL, -- 'article', 'video', 'image', etc.
    content_data JSONB, -- Flexible content storage
    image_url VARCHAR(255),
    video_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, content_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
    is_read BOOLEAN DEFAULT false,
    data JSONB, -- Additional notification data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions (for tracking active sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL, -- 'page_view', 'content_view', 'user_action', etc.
    user_id UUID REFERENCES users(id),
    content_id UUID REFERENCES content(id),
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Salons table
CREATE TABLE IF NOT EXISTS salons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_logo VARCHAR(255),
    salon_name VARCHAR(200) NOT NULL,
    salon_phone VARCHAR(20),
    salon_add_phone VARCHAR(20),
    salon_instagram VARCHAR(100),
    salon_rating DECIMAL(3,2) DEFAULT 0,
    comments JSONB DEFAULT '[]',
    salon_payment JSONB,
    salon_description TEXT,
    salon_types JSONB DEFAULT '[]',
    private_salon BOOLEAN DEFAULT false,
    work_schedule JSONB DEFAULT '[]',
    salon_title VARCHAR(200),
    salon_additionals JSONB DEFAULT '[]',
    sale_percent INTEGER DEFAULT 0,
    sale_limit INTEGER DEFAULT 0,
    location JSONB,
    salon_orient JSONB,
    salon_photos JSONB DEFAULT '[]',
    salon_comfort JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    profession VARCHAR(100),
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255),
    avatar_url VARCHAR(255),
    bio TEXT,
    experience_years INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_waiting BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee comments table
CREATE TABLE IF NOT EXISTS employee_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee posts table
CREATE TABLE IF NOT EXISTS employee_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedule table
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    title VARCHAR(300),
    date DATE NOT NULL,
    repeat BOOLEAN DEFAULT false,
    repeat_value INTEGER DEFAULT NULL,
    employee_list UUID[] DEFAULT '{}',
    price DECIMAL(10,2) NOT NULL,
    full_pay DECIMAL(10,2) DEFAULT NULL,
    deposit DECIMAL(10,2) DEFAULT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_type ON content(content_type);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_salons_name ON salons(salon_name);
CREATE INDEX IF NOT EXISTS idx_salons_rating ON salons(salon_rating);
CREATE INDEX IF NOT EXISTS idx_salons_active ON salons(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_salon_id ON employees(salon_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(username);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_comments_employee_id ON employee_comments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_posts_employee_id ON employee_posts(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedules_salon_id ON schedules(salon_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_active ON schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_master_salons_name ON master_salons(salon_name);
CREATE INDEX IF NOT EXISTS idx_master_salons_rating ON master_salons(salon_rating);
CREATE INDEX IF NOT EXISTS idx_master_salons_active ON master_salons(is_active);

-- Insert default superadmin user (password: admin123)
INSERT INTO admins (username, email, password_hash, full_name, role) 
VALUES (
    'superadmin', 
    'superadmin@freya.com', 
    '$2b$10$dzmXkTgJ2hSJ3NpM0fPeceZiWLP4OLV9Hh5TBZRhArf3kkGp2rH.S', 
    'Super Administrator',
    'superadmin'
) ON CONFLICT (email) DO NOTHING;

-- Insert default admin user (password: admin123)
INSERT INTO admins (username, email, password_hash, full_name, role) 
VALUES (
    'admin', 
    'admin@freya.com', 
    '$2b$10$dzmXkTgJ2hSJ3NpM0fPeceZiWLP4OLV9Hh5TBZRhArf3kkGp2rH.S', 
    'Administrator',
    'admin'
) ON CONFLICT (email) DO NOTHING;