-- ====== SALON ELEGANCE SUPABASE SETUP ======
-- Run this in Supabase Dashboard → SQL Editor → Run all

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    duration TEXT DEFAULT '45 min',
    description TEXT,
    icon TEXT DEFAULT '💇',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    service_name TEXT,
    service_price DECIMAL(10,2),
    date DATE NOT NULL,
    time TIME NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    customer_name TEXT,
    customer_phone TEXT,
    method TEXT CHECK (method IN ('whatsapp', 'sms', 'call', 'walk-in')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
    id TEXT PRIMARY KEY DEFAULT 'admin_001',
    password_hash TEXT NOT NULL,
    salon_name TEXT DEFAULT 'Salon Elegance',
    salon_phone TEXT DEFAULT '0705 455 312',
    salon_email TEXT DEFAULT 'info@salonelegance.com',
    salon_address TEXT DEFAULT 'Nairobi, Kenya',
    working_hours TEXT DEFAULT 'Mon-Sat: 8AM-8PM',
    whatsapp_number TEXT DEFAULT '254705455312',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Insert default admin (password: salon@2024)
INSERT INTO admin_settings (id, password_hash) 
VALUES ('admin_001', '1c43b7a') -- Hash of 'salon@2024'
ON CONFLICT (id) DO UPDATE 
SET password_hash = EXCLUDED.password_hash;

-- 8. Insert sample products
INSERT INTO products (name, category, price, stock, description, image_url) VALUES
('Designer Synthetic Wig', 'wigs', 3500.00, 8, 'Premium quality synthetic wig, easy to style and maintain. Perfect for daily wear or special occasions.', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop'),
('African Print Tote Bag', 'bags', 1200.00, 15, 'Beautiful handmade African print tote bag. Durable and fashionable.', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop'),
('Premium Lipstick Set', 'beauty', 1800.00, 12, 'Set of 6 premium lipsticks in various shades. Long-lasting and moisturizing.', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop'),
('African Print Dress', 'clothes', 2800.00, 7, 'Elegant African print dress for special occasions.', 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&h=400&fit=crop'),
('Maasai Shuka Blanket', 'shukas', 1500.00, 10, 'Traditional Maasai shuka blanket, colorful and warm.', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop')
ON CONFLICT DO NOTHING;

-- 9. Insert sample services
INSERT INTO services (name, category, price, duration, description, icon) VALUES
('Hair Styling & Treatment', 'hair', 1500.00, '60 min', 'Professional hair styling with deep conditioning treatment. Includes wash, treatment, and styling.', '💇'),
('Manicure & Pedicure', 'nails', 1200.00, '75 min', 'Complete hand and foot care including nail shaping, cuticle care, and polish.', '💅'),
('Facial Treatment', 'skin', 2000.00, '90 min', 'Deep cleansing facial with moisturizing and anti-aging treatment.', '✨'),
('Makeup Application', 'beauty', 2500.00, '60 min', 'Professional makeup for events, weddings, or photoshoots.', '💄'),
('Hair Braiding', 'hair', 1800.00, '120 min', 'Traditional African hair braiding with various styles.', '🧑‍🦱')
ON CONFLICT DO NOTHING;

-- 10. Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- 11. Create policies for public read access
CREATE POLICY "Enable read access for everyone" ON products
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for everyone" ON services
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for everyone" ON admin_settings
    FOR SELECT USING (true);

-- 12. Create policies for bookings (public can insert, admin can read all)
CREATE POLICY "Enable insert for everyone" ON bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for everyone" ON bookings
    FOR SELECT USING (customer_phone = current_setting('request.jwt.claims', true)::json->>'phone' OR current_setting('role', true) = 'service_role');

-- 13. Create policies for orders (public can insert, admin can read all)
CREATE POLICY "Enable insert for everyone" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for admin" ON orders
    FOR SELECT USING (current_setting('role', true) = 'service_role');

-- 14. Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 15. Set up storage policies
CREATE POLICY "Public can view images" ON storage.objects 
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can upload images" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can update images" ON storage.objects 
FOR UPDATE USING (bucket_id = 'product-images');

-- 16. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 17. Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 18. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 19. Verify setup
DO $$
DECLARE
    product_count INTEGER;
    service_count INTEGER;
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO product_count FROM products;
    SELECT COUNT(*) INTO service_count FROM services;
    SELECT COUNT(*) INTO admin_count FROM admin_settings;
    
    RAISE NOTICE '✅ Setup complete!';
    RAISE NOTICE '   Products: %', product_count;
    RAISE NOTICE '   Services: %', service_count;
    RAISE NOTICE '   Admin: %', admin_count;
    RAISE NOTICE '   Storage bucket created: product-images';
END $$;