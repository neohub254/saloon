const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'products.json');

// Middleware
app.use(cors());
app.use(express.json());

// Helper to read/write data
async function readData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Default starter products
        const defaultData = [
            {
                id: 1,
                name: "Organic Hair Serum",
                category: "hair",
                description: "Nourishes and protects hair from damage with natural ingredients",
                price: 2500,
                originalPrice: 3000,
                stock: 45,
                image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
                rating: 4.5,
                reviews: 124,
                badge: "Best Seller",
                status: "in-stock",
                createdAt: "2023-10-15"
            },
            {
                id: 2,
                name: "Premium Facial Cream",
                category: "skin",
                description: "Anti-aging cream with natural ingredients for radiant skin",
                price: 3200,
                originalPrice: 3800,
                stock: 28,
                image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
                rating: 4.8,
                reviews: 89,
                badge: "New",
                status: "in-stock",
                createdAt: "2023-11-05"
            }
        ];
        await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
}

async function writeData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// API Routes
app.get('/api/products', async (req, res) => {
    try {
        const products = await readData();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const products = await readData();
        const product = products.find(p => p.id === parseInt(req.params.id));
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const products = await readData();
        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            ...req.body,
            createdAt: new Date().toISOString().split('T')[0],
            reviews: req.body.reviews || 0,
            rating: req.body.rating || 0,
            badge: req.body.badge || null,
            status: req.body.stock > 10 ? 'in-stock' : req.body.stock > 0 ? 'low-stock' : 'out-of-stock'
        };
        
        products.push(newProduct);
        await writeData(products);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const products = await readData();
        const index = products.findIndex(p => p.id === parseInt(req.params.id));
        if (index === -1) return res.status(404).json({ error: 'Product not found' });
        
        const updatedProduct = {
            ...products[index],
            ...req.body,
            status: req.body.stock > 10 ? 'in-stock' : req.body.stock > 0 ? 'low-stock' : 'out-of-stock'
        };
        
        products[index] = updatedProduct;
        await writeData(products);
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const products = await readData();
        const filteredProducts = products.filter(p => p.id !== parseInt(req.params.id));
        
        if (filteredProducts.length === products.length) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        await writeData(filteredProducts);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});