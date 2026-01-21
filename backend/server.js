// server.js - Complete Backend API for Salon Website
// Deploy on Render: https://beautysalon-div4.onrender.com

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 10000;

// ====== MIDDLEWARE ======
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ====== DATA STORAGE ======
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        // Initialize default files if they don't exist
        const files = ['products.json', 'services.json', 'bookings.json', 'orders.json', 'admin.json'];
        
        for (const file of files) {
            const filePath = path.join(DATA_DIR, file);
            try {
                await fs.access(filePath);
            } catch {
                // File doesn't exist, create with default data
                let defaultData = [];
                
                if (file === 'products.json') {
                    defaultData = [
                        {
                            id: 'prod_1',
                            name: 'Designer Synthetic Wig',
                            price: 3500,
                            category: 'wigs',
                            stock: 8,
                            description: 'Premium quality synthetic wig, easy to style and maintain.',
                            image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        },
                        {
                            id: 'prod_2',
                            name: 'African Print Tote Bag',
                            price: 1200,
                            category: 'bags',
                            stock: 15,
                            description: 'Beautiful handmade African print tote bag.',
                            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        },
                        {
                            id: 'prod_3',
                            name: 'Premium Lipstick Set',
                            price: 1800,
                            category: 'beauty',
                            stock: 12,
                            description: 'Set of 6 premium lipsticks in various shades.',
                            image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        }
                    ];
                } else if (file === 'services.json') {
                    defaultData = [
                        {
                            id: 'serv_1',
                            name: 'Hair Styling & Treatment',
                            price: 1500,
                            category: 'hair',
                            duration: '60 min',
                            description: 'Professional hair styling with deep conditioning treatment.',
                            icon: '💇',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        },
                        {
                            id: 'serv_2',
                            name: 'Manicure & Pedicure',
                            price: 1200,
                            category: 'nails',
                            duration: '75 min',
                            description: 'Complete hand and foot care.',
                            icon: '💅',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        }
                    ];
                } else if (file === 'admin.json') {
                    defaultData = {
                        username: 'admin',
                        // Default password: salon@2024 (hashed)
                        password: hashPassword('salon@2024'),
                        lastPasswordChange: new Date().toISOString(),
                        settings: {
                            salonName: 'Salon Elegance',
                            phone: '0705455312',
                            email: 'info@salonelegance.com',
                            address: 'Nairobi, Kenya',
                            workingHours: 'Mon-Sat: 8AM-8PM'
                        }
                    };
                }
                
                await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
                console.log(`Created ${file} with default data`);
            }
        }
    } catch (error) {
        console.error('Error setting up data directory:', error);
    }
}

// ====== UTILITY FUNCTIONS ======

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function hashPassword(password) {
    // Simple hash for demo - in production use bcrypt
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

async function readJsonFile(filename) {
    try {
        const filePath = path.join(DATA_DIR, filename);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return filename.includes('.json') ? [] : {};
    }
}

async function writeJsonFile(filename, data) {
    try {
        const filePath = path.join(DATA_DIR, filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        return false;
    }
}

// ====== AUTHENTICATION MIDDLEWARE ======

async function authenticate(req, res, next) {
    // For now, we'll use simple token-based auth
    // In production, use JWT or sessions
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // For public routes, allow access
        if (req.path.includes('/api/products') || 
            req.path.includes('/api/services') ||
            req.method === 'GET') {
            return next();
        }
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify token (simplified for demo)
    const token = authHeader.split(' ')[1];
    try {
        // In production, verify JWT token
        req.user = { username: 'admin' };
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// ====== API ROUTES ======

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'Salon Elegance API'
    });
});

// ====== PRODUCTS API ======

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await readJsonFile('products.json');
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const products = await readJsonFile('products.json');
        const product = products.find(p => p.id === req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create new product
app.post('/api/products', async (req, res) => {
    try {
        const products = await readJsonFile('products.json');
        const newProduct = {
            id: generateId('prod'),
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        await writeJsonFile('products.json', products);
        
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
    try {
        const products = await readJsonFile('products.json');
        const index = products.findIndex(p => p.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        products[index] = {
            ...products[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        await writeJsonFile('products.json', products);
        
        res.json(products[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const products = await readJsonFile('products.json');
        const filteredProducts = products.filter(p => p.id !== req.params.id);
        
        if (filteredProducts.length === products.length) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        await writeJsonFile('products.json', filteredProducts);
        
        res.json({ 
            message: 'Product deleted successfully',
            deletedId: req.params.id
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// ====== SERVICES API ======

// Get all services
app.get('/api/services', async (req, res) => {
    try {
        const services = await readJsonFile('services.json');
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// Get single service
app.get('/api/services/:id', async (req, res) => {
    try {
        const services = await readJsonFile('services.json');
        const service = services.find(s => s.id === req.params.id);
        
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        res.json(service);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch service' });
    }
});

// Create new service
app.post('/api/services', async (req, res) => {
    try {
        const services = await readJsonFile('services.json');
        const newService = {
            id: generateId('serv'),
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        services.push(newService);
        await writeJsonFile('services.json', services);
        
        res.status(201).json(newService);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create service' });
    }
});

// Update service
app.put('/api/services/:id', async (req, res) => {
    try {
        const services = await readJsonFile('services.json');
        const index = services.findIndex(s => s.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        services[index] = {
            ...services[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        await writeJsonFile('services.json', services);
        
        res.json(services[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update service' });
    }
});

// Delete service
app.delete('/api/services/:id', async (req, res) => {
    try {
        const services = await readJsonFile('services.json');
        const filteredServices = services.filter(s => s.id !== req.params.id);
        
        if (filteredServices.length === services.length) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        await writeJsonFile('services.json', filteredServices);
        
        res.json({ 
            message: 'Service deleted successfully',
            deletedId: req.params.id
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

// ====== BOOKINGS API ======

// Get all bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await readJsonFile('bookings.json');
        
        // Filter by status if provided
        const { status } = req.query;
        if (status && status !== 'all') {
            const filtered = bookings.filter(b => b.status === status);
            return res.json(filtered);
        }
        
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Create new booking
app.post('/api/bookings', async (req, res) => {
    try {
        const bookings = await readJsonFile('bookings.json');
        const newBooking = {
            id: generateId('book'),
            ...req.body,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        bookings.push(newBooking);
        await writeJsonFile('bookings.json', bookings);
        
        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Update booking
app.put('/api/bookings/:id', async (req, res) => {
    try {
        const bookings = await readJsonFile('bookings.json');
        const index = bookings.findIndex(b => b.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        bookings[index] = {
            ...bookings[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        await writeJsonFile('bookings.json', bookings);
        
        res.json(bookings[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update booking' });
    }
});

// Delete booking
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        const bookings = await readJsonFile('bookings.json');
        const filteredBookings = bookings.filter(b => b.id !== req.params.id);
        
        if (filteredBookings.length === bookings.length) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        await writeJsonFile('bookings.json', filteredBookings);
        
        res.json({ 
            message: 'Booking deleted successfully',
            deletedId: req.params.id
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete booking' });
    }
});

// ====== ORDERS API ======

// Get all orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await readJsonFile('orders.json');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Create new order
app.post('/api/orders', async (req, res) => {
    try {
        const orders = await readJsonFile('orders.json');
        const newOrder = {
            id: generateId('ord'),
            ...req.body,
            status: 'completed',
            createdAt: new Date().toISOString()
        };
        
        orders.push(newOrder);
        await writeJsonFile('orders.json', orders);
        
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// ====== BASKET API ======

// Get basket
app.get('/api/basket', async (req, res) => {
    try {
        // For simplicity, using session-based basket
        // In production, use user-specific baskets
        const basket = await readJsonFile('basket.json');
        res.json({ items: basket || [] });
    } catch (error) {
        res.json({ items: [] });
    }
});

// Add to basket
app.post('/api/basket/add', async (req, res) => {
    try {
        let basket = await readJsonFile('basket.json');
        if (!Array.isArray(basket)) basket = [];
        
        const item = req.body;
        const existingIndex = basket.findIndex(b => 
            b.id === item.id && b.type === item.type);
        
        if (existingIndex !== -1) {
            basket[existingIndex].quantity += 1;
        } else {
            basket.push({ ...item, quantity: 1 });
        }
        
        await writeJsonFile('basket.json', basket);
        
        res.json({ items: basket });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add to basket' });
    }
});

// Update basket item
app.put('/api/basket/update', async (req, res) => {
    try {
        const { itemId, quantity } = req.body;
        let basket = await readJsonFile('basket.json');
        
        const itemIndex = basket.findIndex(b => b.id === itemId);
        
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in basket' });
        }
        
        if (quantity <= 0) {
            basket.splice(itemIndex, 1);
        } else {
            basket[itemIndex].quantity = quantity;
        }
        
        await writeJsonFile('basket.json', basket);
        
        res.json({ items: basket });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update basket' });
    }
});

// Remove from basket
app.delete('/api/basket/remove', async (req, res) => {
    try {
        const { itemId } = req.body;
        let basket = await readJsonFile('basket.json');
        
        const filteredBasket = basket.filter(b => b.id !== itemId);
        
        await writeJsonFile('basket.json', filteredBasket);
        
        res.json({ items: filteredBasket });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove from basket' });
    }
});

// Clear basket
app.delete('/api/basket/clear', async (req, res) => {
    try {
        await writeJsonFile('basket.json', []);
        res.json({ items: [] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear basket' });
    }
});

// ====== ADMIN API ======

// Admin login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const adminData = await readJsonFile('admin.json');
        
        if (username === adminData.username && 
            hashPassword(password) === adminData.password) {
            
            // Generate simple token (in production, use JWT)
            const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
            
            res.json({
                success: true,
                token,
                user: {
                    username: adminData.username,
                    lastLogin: new Date().toISOString()
                }
            });
        } else {
            res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Change admin password
app.post('/api/admin/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const adminData = await readJsonFile('admin.json');
        
        // Verify current password
        if (hashPassword(currentPassword) !== adminData.password) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        // Update password
        adminData.password = hashPassword(newPassword);
        adminData.lastPasswordChange = new Date().toISOString();
        
        await writeJsonFile('admin.json', adminData);
        
        res.json({ 
            success: true, 
            message: 'Password changed successfully' 
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Get admin settings
app.get('/api/admin/settings', async (req, res) => {
    try {
        const adminData = await readJsonFile('admin.json');
        res.json(adminData.settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update admin settings
app.put('/api/admin/settings', async (req, res) => {
    try {
        const adminData = await readJsonFile('admin.json');
        adminData.settings = {
            ...adminData.settings,
            ...req.body
        };
        
        await writeJsonFile('admin.json', adminData);
        
        res.json({ 
            success: true, 
            settings: adminData.settings 
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// ====== AVAILABILITY API ======

// Get available time slots for a date
app.get('/api/availability', async (req, res) => {
    try {
        const { date } = req.query;
        
        // Generate time slots (9AM to 7PM, every 45 minutes)
        const slots = [];
        const startHour = 9;
        const endHour = 19;
        const interval = 45;
        
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += interval) {
                if (hour === endHour - 1 && minute + interval > 60) break;
                
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push({
                    time: timeString,
                    available: Math.random() > 0.3 // 70% chance available
                });
            }
        }
        
        res.json({
            date,
            availableSlots: slots,
            totalSlots: slots.length,
            availableCount: slots.filter(s => s.available).length
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check availability' });
    }
});

// ====== STATISTICS API ======

// Get dashboard statistics
app.get('/api/statistics', async (req, res) => {
    try {
        const [products, services, bookings, orders] = await Promise.all([
            readJsonFile('products.json'),
            readJsonFile('services.json'),
            readJsonFile('bookings.json'),
            readJsonFile('orders.json')
        ]);
        
        const today = new Date().toISOString().split('T')[0];
        const todaysBookings = bookings.filter(b => b.date === today);
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        
        res.json({
            products: products.length,
            services: services.length,
            todaysBookings: todaysBookings.length,
            totalBookings: bookings.length,
            totalOrders: orders.length,
            totalRevenue: totalRevenue,
            averageOrder: orders.length > 0 ? totalRevenue / orders.length : 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// ====== EXPORT API ======

// Export data
app.get('/api/export/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { format = 'json' } = req.query;
        
        let data, filename;
        
        switch(type) {
            case 'products':
                data = await readJsonFile('products.json');
                filename = `products_${new Date().toISOString().split('T')[0]}`;
                break;
            case 'services':
                data = await readJsonFile('services.json');
                filename = `services_${new Date().toISOString().split('T')[0]}`;
                break;
            case 'bookings':
                data = await readJsonFile('bookings.json');
                filename = `bookings_${new Date().toISOString().split('T')[0]}`;
                break;
            case 'all':
                data = {
                    products: await readJsonFile('products.json'),
                    services: await readJsonFile('services.json'),
                    bookings: await readJsonFile('bookings.json'),
                    orders: await readJsonFile('orders.json'),
                    exported: new Date().toISOString()
                };
                filename = `salon_backup_${new Date().toISOString().split('T')[0]}`;
                break;
            default:
                return res.status(400).json({ error: 'Invalid export type' });
        }
        
        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
            res.send(JSON.stringify(data, null, 2));
        } else if (format === 'csv') {
            if (type === 'all') {
                return res.status(400).json({ error: 'CSV not available for full backup' });
            }
            
            // Convert to CSV
            const csv = convertToCSV(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
            res.send(csv);
        } else {
            res.status(400).json({ error: 'Invalid format' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Export failed' });
    }
});

function convertToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => 
        headers.map(header => {
            const value = obj[header];
            if (typeof value === 'object') {
                return JSON.stringify(value);
            }
            return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
}

// ====== FILE UPLOAD ======

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        fs.mkdir(uploadDir, { recursive: true }).then(() => {
            cb(null, uploadDir);
        }).catch(err => cb(err));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Upload image
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // In production, upload to cloud storage (S3, Cloudinary, etc.)
        // For Render free tier, we'll store locally and serve static files
        
        const imageUrl = `/uploads/${req.file.filename}`;
        
        res.json({
            success: true,
            url: imageUrl,
            filename: req.file.filename,
            size: req.file.size
        });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ====== PUBLIC IMAGES API ======

// Get public images
app.get('/api/public-images', async (req, res) => {
    try {
        const publicImages = [
            {
                url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop',
                category: 'wigs',
                title: 'Designer Wig'
            },
            {
                url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
                category: 'bags',
                title: 'African Bag'
            },
            {
                url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop',
                category: 'beauty',
                title: 'Lipstick Set'
            },
            {
                url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
                category: 'beauty',
                title: 'Makeup Brushes'
            },
            {
                url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&h=400&fit=crop',
                category: 'clothes',
                title: 'African Dress'
            },
            {
                url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
                category: 'shukas',
                title: 'Traditional Shuka'
            },
            {
                url: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=400&h=400&fit=crop',
                category: 'wigs',
                title: 'Curly Wig'
            }
        ];
        
        res.json(publicImages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch public images' });
    }
});

// ====== ERROR HANDLING ======

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large (max 2MB)' });
        }
    }
    
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ====== START SERVER ======

async function startServer() {
    await ensureDataDir();
    
    app.listen(PORT, () => {
        console.log(`
        🚀 Salon Elegance Backend Server
        =================================
        🌐 URL: http://localhost:${PORT}
        📍 API Base: http://localhost:${PORT}/api
        📁 Data Directory: ${DATA_DIR}
        ⏰ Started: ${new Date().toLocaleString()}
        =================================
        
        📋 Available Endpoints:
        - GET    /api/health          - Health check
        - GET    /api/products        - Get all products
        - POST   /api/products        - Create product
        - GET    /api/services        - Get all services
        - POST   /api/services        - Create service
        - GET    /api/bookings        - Get bookings
        - POST   /api/bookings        - Create booking
        - POST   /api/admin/login     - Admin login
        - GET    /api/statistics      - Dashboard stats
        - GET    /api/export/:type    - Export data
        - POST   /api/upload          - Upload image
        
        🔑 Default Admin Login:
        - Username: admin
        - Password: salon@2024
        `);
    });
}

startServer().catch(console.error);

module.exports = app;
