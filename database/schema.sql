-- CSonic Database Schema
-- SQLite Database for WhatsApp Business Bot System

-- Businesses Table
CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'barber', 'carwash', 'spaza', etc.
    phone_number TEXT NOT NULL UNIQUE,
    whatsapp_number TEXT NOT NULL,
    location TEXT,
    language TEXT DEFAULT 'en', -- 'en', 'af', 'xh', 'zu', 'st'
    operating_hours TEXT, -- JSON string: {"monday": "09:00-17:00", ...}
    ai_enabled INTEGER DEFAULT 1, -- 0 or 1
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone_number TEXT NOT NULL UNIQUE,
    language TEXT DEFAULT 'en',
    business_id INTEGER,
    last_interaction DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- Services Table (for barber and carwash)
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    duration INTEGER, -- in minutes
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- Products Table (for spaza shops)
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    service_id INTEGER,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Orders Table (for spaza shops)
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    items TEXT NOT NULL, -- JSON string: [{"product_id": 1, "quantity": 2, "price": 50}, ...]
    total_amount REAL NOT NULL,
    delivery_type TEXT DEFAULT 'pickup', -- 'pickup' or 'delivery'
    delivery_address TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER,
    customer_id INTEGER,
    direction TEXT NOT NULL, -- 'incoming' or 'outgoing'
    message_text TEXT NOT NULL,
    message_type TEXT DEFAULT 'text', -- 'text', 'image', 'document', etc.
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Broadcasts Table
CREATE TABLE IF NOT EXISTS broadcasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    message_text TEXT NOT NULL,
    target_audience TEXT DEFAULT 'all', -- 'all' or specific criteria
    sent_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sent'
    scheduled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- FAQ Rules Table (for AI responses)
CREATE TABLE IF NOT EXISTS faq_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    question_pattern TEXT NOT NULL, -- Pattern or keyword
    answer TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    priority INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_businesses_type ON businesses(type);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);

