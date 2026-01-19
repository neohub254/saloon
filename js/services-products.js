/*
=============================================
SERVICES & PRODUCTS PAGE JAVASCRIPT
Functionality for services-products.html
=============================================
*/

document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initViewToggle();
    initCategoryFilter();
    initSearchFunctionality();
    loadServices();
    loadProducts();
    initProductActions();
    initMobileMenu();
});

// ========== MOBILE MENU ==========
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeMenuBtn = document.querySelector('.close-mobile-menu');
    
    if (hamburger && mobileMenu) {
        // Open menu when hamburger clicked
        hamburger.addEventListener('click', () => {
            mobileMenu.classList.add('active');
        });
        
        // Close menu when X button clicked
        if (closeMenuBtn) {
            closeMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
            });
        }
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('active');
            }
        });
    }
}

// ========== VIEW TOGGLE ==========
function initViewToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const servicesView = document.getElementById('servicesView');
    const productsView = document.getElementById('productsView');
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            
            // Update active button
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show selected view
            if (view === 'services') {
                servicesView.classList.add('active-view');
                productsView.classList.remove('active-view');
            } else {
                servicesView.classList.remove('active-view');
                productsView.classList.add('active-view');
            }
        });
    });
}

// ========== CATEGORY FILTER ==========
function initCategoryFilter() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    const clearFiltersBtn = document.querySelector('.clear-filters');
    
    // Filter services/products by category
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            
            // Update active button
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter items
            filterItemsByCategory(category);
        });
    });
    
    // Clear filters
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            categoryBtns[0].classList.add('active'); // Select "All" category
            filterItemsByCategory('all');
        });
    }
}

function filterItemsByCategory(category) {
    const services = document.querySelectorAll('.service-item');
    const products = document.querySelectorAll('.product-item');
    
    if (category === 'all') {
        services.forEach(item => item.style.display = 'block');
        products.forEach(item => item.style.display = 'block');
        return;
    }
    
    // Filter services
    services.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        if (itemCategory === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
    
    // Filter products
    products.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        if (itemCategory === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// ========== SEARCH FUNCTIONALITY ==========
function initSearchFunctionality() {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.querySelector('.clear-search');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            searchItems(searchTerm);
        }, 300));
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchItems('');
        });
    }
}

function searchItems(searchTerm) {
    const services = document.querySelectorAll('.service-item');
    const products = document.querySelectorAll('.product-item');
    
    if (!searchTerm) {
        services.forEach(item => item.style.display = 'block');
        products.forEach(item => item.style.display = 'block');
        return;
    }
    
    // Search in services
    services.forEach(item => {
        const name = item.querySelector('.service-name').textContent.toLowerCase();
        const description = item.querySelector('.service-description').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || description.includes(searchTerm)) {
            item.style.display = 'block';
            // Highlight matching text
            highlightText(item, searchTerm);
        } else {
            item.style.display = 'none';
        }
    });
    
    // Search in products
    products.forEach(item => {
        const name = item.querySelector('.product-name').textContent.toLowerCase();
        const description = item.querySelector('.product-description').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || description.includes(searchTerm)) {
            item.style.display = 'block';
            // Highlight matching text
            highlightText(item, searchTerm);
        } else {
            item.style.display = 'none';
        }
    });
}

function highlightText(element, searchTerm) {
    // Remove previous highlights
    const highlights = element.querySelectorAll('.highlight');
    highlights.forEach(hl => {
        const parent = hl.parentNode;
        parent.replaceChild(document.createTextNode(hl.textContent), hl);
        parent.normalize();
    });
    
    if (!searchTerm) return;
    
    // Highlight matching text
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const nodes = [];
    let node;
    while (node = walker.nextNode()) {
        nodes.push(node);
    }
    
    nodes.forEach(node => {
        if (node.parentNode.classList.contains('highlight')) return;
        
        const text = node.textContent;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const newText = text.replace(regex, '<span class="highlight">$1</span>');
        
        if (newText !== text) {
            const span = document.createElement('span');
            span.innerHTML = newText;
            node.parentNode.replaceChild(span, node);
        }
    });
}

// ========== LOAD SERVICES ==========
function loadServices() {
    const servicesContainer = document.getElementById('servicesContainer');
    if (!servicesContainer) return;
    
    // Sample services data
    const services = [
        {
            id: 1,
            category: 'hair',
            name: 'Haircut & Styling',
            description: 'Professional haircut with blow-dry styling and finishing.',
            price: 'KSH 1,500',
            duration: '1 hour',
            icon: 'cut'
        },
        {
            id: 2,
            category: 'hair',
            name: 'Hair Coloring',
            description: 'Full head hair coloring with premium products.',
            price: 'KSH 3,500',
            duration: '2 hours',
            icon: 'fill-drip'
        },
        {
            id: 3,
            category: 'hair',
            name: 'Hair Extensions',
            description: 'Premium hair extensions installation.',
            price: 'KSH 8,000',
            duration: '3 hours',
            icon: 'layer-group'
        },
        {
            id: 4,
            category: 'skincare',
            name: 'Basic Facial',
            description: 'Cleansing, exfoliation, and hydration facial.',
            price: 'KSH 2,500',
            duration: '1 hour',
            icon: 'spa'
        },
        {
            id: 5,
            category: 'skincare',
            name: 'Anti-Aging Facial',
            description: 'Advanced facial treatment for youthful skin.',
            price: 'KSH 4,000',
            duration: '1.5 hours',
            icon: 'leaf'
        },
        {
            id: 6,
            category: 'makeup',
            name: 'Bridal Makeup',
            description: 'Full bridal makeup with trial session.',
            price: 'KSH 5,000',
            duration: '2 hours',
            icon: 'heart'
        },
        {
            id: 7,
            category: 'makeup',
            name: 'Event Makeup',
            description: 'Glamorous makeup for special occasions.',
            price: 'KSH 3,000',
            duration: '1.5 hours',
            icon: 'star'
        },
        {
            id: 8,
            category: 'nails',
            name: 'Classic Manicure',
            description: 'Basic nail care with polish application.',
            price: 'KSH 1,200',
            duration: '45 mins',
            icon: 'hand-sparkles'
        },
        {
            id: 9,
            category: 'nails',
            name: 'Gel Nails',
            description: 'Gel polish application with nail art.',
            price: 'KSH 2,500',
            duration: '1.5 hours',
            icon: 'palette'
        },
        {
            id: 10,
            category: 'waxing',
            name: 'Full Body Wax',
            description: 'Complete body waxing service.',
            price: 'KSH 6,000',
            duration: '2 hours',
            icon: 'fire'
        },
        {
            id: 11,
            category: 'bridal',
            name: 'Bridal Package',
            description: 'Complete bridal package with hair and makeup.',
            price: 'KSH 12,000',
            duration: '4 hours',
            icon: 'gem'
        }
    ];
    
    // Clear container
    servicesContainer.innerHTML = '';
    
    // Add services to DOM
    services.forEach(service => {
        const serviceItem = createServiceElement(service);
        servicesContainer.appendChild(serviceItem);
    });
    
    // Initialize service actions
    initServiceActions();
}

function createServiceElement(service) {
    const div = document.createElement('div');
    div.className = 'service-item glass-card hover-lift';
    div.setAttribute('data-category', service.category);
    div.setAttribute('data-id', service.id);
    
    const iconClass = getIconClass(service.icon);
    
    div.innerHTML = `
        <div class="service-icon">
            <i class="fas fa-${iconClass}"></i>
        </div>
        <div class="service-category">${service.category}</div>
        <h3 class="service-name">${service.name}</h3>
        <p class="service-description">${service.description}</p>
        <div class="service-details">
            <div class="service-price">${service.price}</div>
            <div class="service-duration">
                <i class="fas fa-clock"></i>
                ${service.duration}
            </div>
        </div>
        <button class="book-service-btn">
            <i class="fas fa-calendar-check"></i>
            <span>Book Now</span>
        </button>
    `;
    
    return div;
}

function getIconClass(iconName) {
    const iconMap = {
        'cut': 'cut',
        'fill-drip': 'fill-drip',
        'layer-group': 'layer-group',
        'spa': 'spa',
        'leaf': 'leaf',
        'heart': 'heart',
        'star': 'star',
        'hand-sparkles': 'hand-sparkles',
        'palette': 'palette',
        'fire': 'fire',
        'gem': 'gem'
    };
    
    return iconMap[iconName] || 'spa';
}

// ========== LOAD PRODUCTS ==========
async function loadProducts() {
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return;
    
    // Show loading message
    productsContainer.innerHTML = '<div class="loading-message">Loading products...</div>';
    
    // DEMO PRODUCTS (will show if backend is empty or fails)
    const demoProducts = [
        {
            id: 1,
            category: 'hair',
            name: 'Organic Hair Serum',
            description: 'Nourishes and protects hair from damage.',
            price: 'KSH 2,500',
            rating: 4.5,
            badge: 'BESTSELLER',
            image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 2,
            category: 'skincare',
            name: 'Premium Facial Cream',
            description: 'Anti-aging with natural ingredients.',
            price: 'KSH 3,200',
            rating: 5,
            badge: 'NEW',
            image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 3,
            category: 'nails',
            name: 'Nail Care Kit',
            description: 'Complete set for professional nail care.',
            price: 'KSH 4,800',
            rating: 4.5,
            badge: 'SALE',
            image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 4,
            category: 'hair',
            name: 'Color Protection Shampoo',
            description: 'Protects colored hair from fading.',
            price: 'KSH 1,800',
            rating: 4,
            badge: '',
            image: 'https://images.unsplash.com/photo-1560743173-567a3b5658b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 5,
            category: 'makeup',
            name: 'Luxury Lipstick Set',
            description: 'Set of 6 premium lipstick shades.',
            price: 'KSH 3,500',
            rating: 4.8,
            badge: 'NEW',
            image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 6,
            category: 'tools',
            name: 'Professional Makeup Brushes',
            description: 'Complete set of 12 makeup brushes.',
            price: 'KSH 6,500',
            rating: 4.7,
            badge: '',
            image: 'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        }
    ];
    
    try {
        // Try to fetch products from your Render backend
        const response = await fetch('https://beautysalon-div4.onrender.com/api/products');
        
        if (response.ok) {
            const backendProducts = await response.json();
            
            // If backend has products, use them
            if (backendProducts && backendProducts.length > 0) {
                console.log('Showing products from backend');
                displayProducts(backendProducts);
                return;
            }
        }
        
        // If backend empty or error, show demo products
        console.log('Showing demo products');
        displayProducts(demoProducts);
        
    } catch (error) {
        // If network error, show demo products
        console.error('Network error, showing demo products:', error);
        displayProducts(demoProducts);
    }
}

// Helper function to display products
function displayProducts(productsArray) {
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return;
    
    // Clear container
    productsContainer.innerHTML = '';
    
    // Add products to DOM
    productsArray.forEach(product => {
        const productItem = createProductElement(product);
        productsContainer.appendChild(productItem);
    });
    
    // Re-initialize actions for the new product buttons
    initProductActions();
}

function createProductElement(product) {
    const div = document.createElement('div');
    div.className = 'product-item glass-card hover-tilt';
    div.setAttribute('data-category', product.category);
    div.setAttribute('data-id', product.id);
    
    // Handle price formatting
    let priceDisplay;
    if (typeof product.price === 'number') {
        priceDisplay = 'KSH ' + product.price.toLocaleString();
    } else if (product.price && product.price.startsWith('KSH')) {
        priceDisplay = product.price;
    } else {
        priceDisplay = 'KSH ' + (product.price || '0');
    }
    
    const badgeHtml = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';
    const starsHtml = generateStarRating(product.rating || 0);
    
    div.innerHTML = `
        ${badgeHtml}
        <div class="product-image" style="background-image: url('${product.image || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}')">
            <div class="product-overlay">
                <button class="quick-view-product-btn" data-product="${product.id}">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
        <div class="product-info">
            <div class="product-category">${product.category}</div>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-rating">
                ${starsHtml}
                <span class="rating-count">(${product.rating || 0})</span>
            </div>
            <div class="product-footer">
                <div class="product-price">${priceDisplay}</div>
                <button class="add-to-cart-product-btn" data-product="${product.id}">
                    <i class="fas fa-shopping-cart"></i>
                    <span>Add to Cart</span>
                </button>
            </div>
        </div>
    `;
    
    return div;
}

function generateStarRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    
    return stars;
}

// ========== SERVICE ACTIONS ==========
function initServiceActions() {
    const bookServiceBtns = document.querySelectorAll('.book-service-btn');
    
    bookServiceBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const serviceItem = this.closest('.service-item');
            const serviceName = serviceItem.querySelector('.service-name').textContent;
            const servicePrice = serviceItem.querySelector('.service-price').textContent;
            
            // Create WhatsApp message
            const message = `Hello! I'd like to book a service:\nService: ${serviceName}\nPrice: ${servicePrice}\nPlease let me know available times.`;
            const encodedMessage = encodeURIComponent(message);
            
            // Open WhatsApp
            window.open(`https://wa.me/254705455312?text=${encodedMessage}`, '_blank');
        });
    });
}

// ========== PRODUCT ACTIONS ==========
function initProductActions() {
    const addToCartBtns = document.querySelectorAll('.add-to-cart-product-btn');
    const quickViewBtns = document.querySelectorAll('.quick-view-product-btn');
    
    // Add to cart functionality
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-product');
            const productItem = this.closest('.product-item');
            const productName = productItem.querySelector('.product-name').textContent;
            const productPrice = productItem.querySelector('.product-price').textContent;
            
            // Create WhatsApp message
            const message = `Hello! I'd like to purchase:\nProduct: ${productName}\nPrice: ${productPrice}\nPlease let me know how to proceed.`;
            const encodedMessage = encodeURIComponent(message);
            
            // Open WhatsApp
            window.open(`https://wa.me/254705455312?text=${encodedMessage}`, '_blank');
        });
    });
    
    // Quick view functionality
    quickViewBtns.forEach(btn => {
        btn.addEventListener('click', async function() {
            const productId = this.getAttribute('data-product');
            await showProductQuickView(productId);
        });
    });
}

async function showProductQuickView(productId) {
    try {
        // Try to fetch product details from backend
        const response = await fetch(`https://beautysalon-div4.onrender.com/api/products/${productId}`);
        
        if (response.ok) {
            const product = await response.json();
            createQuickViewModal(product);
        } else {
            // Fallback to demo data
            showDemoQuickView(productId);
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
        showDemoQuickView(productId);
    }
}

function showDemoQuickView(productId) {
    // Demo product data
    const demoProducts = {
        1: {
            name: 'Organic Hair Serum',
            category: 'Hair Care',
            price: 'KSH 2,500',
            description: 'Premium organic hair serum that nourishes and protects hair from damage. Made with natural ingredients like argan oil, coconut oil, and vitamin E.',
            features: ['Reduces frizz', 'Adds shine', 'Protects from heat', 'Strengthens hair'],
            ingredients: 'Argan Oil, Coconut Oil, Vitamin E, Keratin',
            usage: 'Apply to damp hair, style as usual'
        },
        2: {
            name: 'Premium Facial Cream',
            category: 'Skincare',
            price: 'KSH 3,200',
            description: 'Anti-aging facial cream with natural ingredients that hydrates and rejuvenates skin. Contains hyaluronic acid, vitamin C, and retinol.',
            features: ['Anti-aging', 'Hydrating', 'Brightening', 'Non-greasy'],
            ingredients: 'Hyaluronic Acid, Vitamin C, Retinol, Aloe Vera',
            usage: 'Apply morning and evening to clean face'
        }
    };
    
    const product = demoProducts[productId];
    if (!product) return;
    createQuickViewModal(product);
}

function createQuickViewModal(product) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'product-quick-view-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content glass-card">
            <button class="close-modal"><i class="fas fa-times"></i></button>
            <div class="modal-body">
                <h3>${product.name}</h3>
                <div class="product-category">${product.category}</div>
                <div class="product-price">${product.price}</div>
                <p class="product-description">${product.description}</p>
                <div class="product-details">
                    <div class="detail-section">
                        <h4><i class="fas fa-list"></i> Features</h4>
                        <ul>
                            ${product.features ? product.features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('') : ''}
                        </ul>
                    </div>
                    <div class="detail-section">
                        <h4><i class="fas fa-flask"></i> Key Ingredients</h4>
                        <p>${product.ingredients || ''}</p>
                    </div>
                    <div class="detail-section">
                        <h4><i class="fas fa-info-circle"></i> How to Use</h4>
                        <p>${product.usage || ''}</p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="buy-now-btn">
                        <i class="fas fa-shopping-cart"></i>
                        Buy Now via WhatsApp
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .product-quick-view-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1002;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        }
        
        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 15, 26, 0.9);
            backdrop-filter: blur(5px);
        }
        
        .modal-content {
            position: relative;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            z-index: 1003;
            padding: 40px;
            animation: slideInUp 0.4s ease;
        }
        
        .close-modal {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--transition-smooth);
        }
        
        .close-modal:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .modal-body {
            padding-top: 20px;
        }
        
        .product-category {
            color: var(--lime-green);
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .product-price {
            font-size: 2rem;
            font-weight: 700;
            color: var(--accent-gold);
            margin-bottom: 20px;
        }
        
        .product-description {
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.6;
            margin-bottom: 30px;
        }
        
        .product-details {
            display: grid;
            gap: 25px;
            margin-bottom: 30px;
        }
        
        .detail-section h4 {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
            color: white;
        }
        
        .detail-section ul {
            list-style: none;
            padding-left: 0;
        }
        
        .detail-section li {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .detail-section li i {
            color: var(--lime-green);
            font-size: 12px;
        }
        
        .modal-actions {
            text-align: center;
        }
        
        .buy-now-btn {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            background: var(--gradient-primary);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 30px;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            transition: var(--transition-smooth);
        }
        
        .buy-now-btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-glow);
        }
    `;
    
    document.head.appendChild(style);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.close-modal');
    const overlay = modal.querySelector('.modal-overlay');
    const buyBtn = modal.querySelector('.buy-now-btn');
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    if (buyBtn) {
        buyBtn.addEventListener('click', () => {
            const message = `Hello! I want to buy:\nProduct: ${product.name}\nPrice: ${product.price}`;
            window.open(`https://wa.me/254705455312?text=${encodeURIComponent(message)}`, '_blank');
        });
    }
    
    function closeModal() {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            modal.remove();
            style.remove();
        }, 300);
    }
    
    // Close on escape key
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
}

// ========== UTILITY FUNCTIONS ==========
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
