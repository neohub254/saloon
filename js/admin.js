// admin.js - Complete Admin Dashboard Functionality
// Connects to Render backend: https://beautysalon-div4.onrender.com

// ====== CONFIGURATION ======
const API_BASE_URL = 'https://beautysalon-div4.onrender.com';
const API_ENDPOINTS = {
    products: '/api/products',
    services: '/api/services',
    bookings: '/api/bookings',
    orders: '/api/orders',
    admin: '/api/admin',
    auth: '/api/auth'
};

// ====== DEFAULT DATA ======
const DEFAULT_PRODUCTS = [
    {
        id: 'prod_1',
        name: 'Designer Synthetic Wig',
        price: 3500,
        category: 'wigs',
        stock: 8,
        description: 'Premium quality synthetic wig, easy to style and maintain. Perfect for daily wear or special occasions.',
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop'
    },
    {
        id: 'prod_2',
        name: 'African Print Tote Bag',
        price: 1200,
        category: 'bags',
        stock: 15,
        description: 'Beautiful handmade African print tote bag. Durable and fashionable.',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop'
    },
    {
        id: 'prod_3',
        name: 'Premium Lipstick Set',
        price: 1800,
        category: 'beauty',
        stock: 12,
        description: 'Set of 6 premium lipsticks in various shades. Long-lasting and moisturizing.',
        image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w-400&h=400&fit=crop'
    }
];

const DEFAULT_SERVICES = [
    {
        id: 'serv_1',
        name: 'Hair Styling & Treatment',
        price: 1500,
        category: 'hair',
        duration: '60 min',
        description: 'Professional hair styling with deep conditioning treatment. Includes wash, treatment, and styling.',
        icon: '💇'
    },
    {
        id: 'serv_2',
        name: 'Manicure & Pedicure',
        price: 1200,
        category: 'nails',
        duration: '75 min',
        description: 'Complete hand and foot care including nail shaping, cuticle care, and polish.',
        icon: '💅'
    }
];

const PUBLIC_IMAGES = [
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
        url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
        category: 'beauty',
        title: 'Skincare'
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

// ====== GLOBAL VARIABLES ======
let currentUser = null;
let allProducts = [];
let allServices = [];
let allBookings = [];
let allOrders = [];
let currentSection = 'dashboard';
let deleteCallback = null;
let deleteItemId = null;
let deleteItemType = null;

// ====== DOM ELEMENTS ======
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const togglePasswordBtn = document.getElementById('toggle-password');
const adminPasswordInput = document.getElementById('admin-password');
const logoutBtn = document.getElementById('logout-btn');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('dashboard-sidebar');
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');

// Stats elements
const statProducts = document.getElementById('stat-products');
const statServices = document.getElementById('stat-services');
const statBookings = document.getElementById('stat-bookings');
const statRevenue = document.getElementById('stat-revenue');

// Count elements
const productsCount = document.getElementById('products-count');
const servicesCount = document.getElementById('services-count');
const bookingsCount = document.getElementById('bookings-count');
const ordersCount = document.getElementById('orders-count');

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel initializing...');
    
    checkLoginStatus();
    setupEventListeners();
    initializeDefaultData();
    
    // Check backend connection
    checkBackendConnection();
});

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
    const sessionTime = localStorage.getItem('admin_session_time');
    
    // Check if session expired (30 minutes)
    if (sessionTime && (Date.now() - parseInt(sessionTime)) > 30 * 60 * 1000) {
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_session_time');
        showLogin();
    } else if (isLoggedIn) {
        showDashboard();
        loadDashboardData();
    } else {
        showLogin();
    }
}

function setupEventListeners() {
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Toggle password visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = adminPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            adminPasswordInput.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Menu toggle (mobile)
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Navigation items
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchSection(section);
            
            // Close sidebar on mobile after selection
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    // Quick action buttons
    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            handleQuickAction(action);
        });
    });
    
    // Add product button
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => openProductModal());
    }
    
    // Add service button
    const addServiceBtn = document.getElementById('add-service-btn');
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', () => openServiceModal());
    }
    
    // Add booking button
    const addBookingBtn = document.getElementById('add-booking-btn');
    if (addBookingBtn) {
        addBookingBtn.addEventListener('click', () => openBookingModal());
    }
    
    // Refresh buttons
    const refreshProducts = document.getElementById('refresh-products');
    const refreshServices = document.getElementById('refresh-services');
    
    if (refreshProducts) refreshProducts.addEventListener('click', () => loadProducts());
    if (refreshServices) refreshServices.addEventListener('click', () => loadServices());
    
    // Search and filter
    const searchProducts = document.getElementById('search-products');
    const productCategoryFilter = document.getElementById('product-category-filter');
    const bookingStatusFilter = document.getElementById('booking-status-filter');
    
    if (searchProducts) searchProducts.addEventListener('input', debounce(filterProducts, 300));
    if (productCategoryFilter) productCategoryFilter.addEventListener('change', filterProducts);
    if (bookingStatusFilter) bookingStatusFilter.addEventListener('change', filterBookings);
    
    // Export buttons
    document.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            const format = this.getAttribute('data-format');
            exportData(type, format);
        });
    });
    
    // Settings forms
    const generalSettingsForm = document.getElementById('general-settings');
    const passwordForm = document.getElementById('password-form');
    
    if (generalSettingsForm) {
        generalSettingsForm.addEventListener('submit', saveGeneralSettings);
    }
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', changePassword);
    }
    
    // Backup buttons
    const backupNowBtn = document.getElementById('backup-now');
    const downloadBackupBtn = document.getElementById('download-backup');
    const restoreBtn = document.getElementById('restore-btn');
    
    if (backupNowBtn) backupNowBtn.addEventListener('click', createBackup);
    if (downloadBackupBtn) downloadBackupBtn.addEventListener('click', downloadBackup);
    if (restoreBtn) restoreBtn.addEventListener('click', restoreBackup);
    
    // System buttons
    const clearCacheBtn = document.getElementById('clear-cache');
    const systemCheckBtn = document.getElementById('system-check');
    
    if (clearCacheBtn) clearCacheBtn.addEventListener('click', clearCache);
    if (systemCheckBtn) systemCheckBtn.addEventListener('click', runSystemCheck);
    
    // Modal close buttons
    document.querySelectorAll('.close-modal, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    // Delete confirmation
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', () => closeModal('delete-modal'));
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDelete);
    
    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAllModals();
            }
        });
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// ====== AUTHENTICATION FUNCTIONS ======

async function handleLogin(e) {
    e.preventDefault();
    
    const password = adminPasswordInput.value;
    const defaultPassword = 'salon@2024';
    
    if (!password) {
        showToast('Please enter password', 'error');
        return;
    }
    
    // Check against default password
    if (password === defaultPassword) {
        // Success - login
        localStorage.setItem('admin_logged_in', 'true');
        localStorage.setItem('admin_session_time', Date.now().toString());
        localStorage.setItem('admin_password', hashPassword(password));
        
        showToast('Login successful!', 'success');
        showDashboard();
        loadDashboardData();
    } else {
        // Check if password was changed
        const storedHash = localStorage.getItem('admin_password');
        if (storedHash && storedHash === hashPassword(password)) {
            localStorage.setItem('admin_logged_in', 'true');
            localStorage.setItem('admin_session_time', Date.now().toString());
            
            showToast('Login successful!', 'success');
            showDashboard();
            loadDashboardData();
        } else {
            showToast('Incorrect password', 'error');
        }
    }
}

function handleLogout() {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_session_time');
    showToast('Logged out successfully', 'success');
    showLogin();
}

function showLogin() {
    loginSection.classList.add('active');
    dashboardSection.classList.remove('active');
    if (loginForm) loginForm.reset();
}

function showDashboard() {
    loginSection.classList.remove('active');
    dashboardSection.classList.add('active');
    updateSessionTime();
}

function updateSessionTime() {
    localStorage.setItem('admin_session_time', Date.now().toString());
}

// ====== DASHBOARD FUNCTIONS ======

async function loadDashboardData() {
    try {
        // Try to load from backend first
        await Promise.all([
            loadProducts(),
            loadServices(),
            loadBookings(),
            loadOrders()
        ]);
        
        updateDashboardStats();
        updateNavCounts();
        loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Fallback to local data
        loadLocalData();
    }
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.products}`);
        if (response.ok) {
            allProducts = await response.json();
            // Save to localStorage as backup
            localStorage.setItem('salon_products', JSON.stringify(allProducts));
        } else {
            throw new Error('Failed to fetch products');
        }
    } catch (error) {
        console.log('Loading products from localStorage...');
        const localProducts = localStorage.getItem('salon_products');
        if (localProducts) {
            allProducts = JSON.parse(localProducts);
        } else {
            // Load default products
            allProducts = [...DEFAULT_PRODUCTS];
            localStorage.setItem('salon_products', JSON.stringify(allProducts));
        }
    }
    
    renderProductsTable();
    updateDashboardStats();
}

async function loadServices() {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.services}`);
        if (response.ok) {
            allServices = await response.json();
            localStorage.setItem('salon_services', JSON.stringify(allServices));
        } else {
            throw new Error('Failed to fetch services');
        }
    } catch (error) {
        console.log('Loading services from localStorage...');
        const localServices = localStorage.getItem('salon_services');
        if (localServices) {
            allServices = JSON.parse(localServices);
        } else {
            allServices = [...DEFAULT_SERVICES];
            localStorage.setItem('salon_services', JSON.stringify(allServices));
        }
    }
    
    renderServicesTable();
    updateDashboardStats();
}

async function loadBookings() {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.bookings}`);
        if (response.ok) {
            allBookings = await response.json();
            localStorage.setItem('salon_bookings', JSON.stringify(allBookings));
        } else {
            throw new Error('Failed to fetch bookings');
        }
    } catch (error) {
        console.log('Loading bookings from localStorage...');
        const localBookings = localStorage.getItem('salon_bookings');
        if (localBookings) {
            allBookings = JSON.parse(localBookings);
        }
    }
    
    renderBookingsTable();
    updateDashboardStats();
}

async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.orders}`);
        if (response.ok) {
            allOrders = await response.json();
            localStorage.setItem('salon_orders', JSON.stringify(allOrders));
        } else {
            throw new Error('Failed to fetch orders');
        }
    } catch (error) {
        console.log('Loading orders from localStorage...');
        const localOrders = localStorage.getItem('salon_orders');
        if (localOrders) {
            allOrders = JSON.parse(localOrders);
        }
    }
    
    renderOrdersTable();
    updateDashboardStats();
}

function updateDashboardStats() {
    // Update product count
    if (statProducts) statProducts.textContent = allProducts.length;
    if (productsCount) productsCount.textContent = allProducts.length;
    
    // Update service count
    if (statServices) statServices.textContent = allServices.length;
    if (servicesCount) servicesCount.textContent = allServices.length;
    
    // Update bookings count (today's bookings)
    const today = new Date().toISOString().split('T')[0];
    const todaysBookings = allBookings.filter(b => b.date === today);
    if (statBookings) statBookings.textContent = todaysBookings.length;
    if (bookingsCount) bookingsCount.textContent = allBookings.length;
    
    // Update revenue
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    if (statRevenue) statRevenue.textContent = `Ksh ${totalRevenue.toLocaleString()}`;
    if (ordersCount) ordersCount.textContent = allOrders.length;
    
    // Update orders summary
    const totalOrders = document.getElementById('total-orders');
    const totalRevenueEl = document.getElementById('total-revenue');
    const avgOrder = document.getElementById('avg-order');
    
    if (totalOrders) totalOrders.textContent = allOrders.length;
    if (totalRevenueEl) totalRevenueEl.textContent = `Ksh ${totalRevenue.toLocaleString()}`;
    if (avgOrder) {
        const avg = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;
        avgOrder.textContent = `Ksh ${Math.round(avg).toLocaleString()}`;
    }
}

function loadRecentActivity() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    // Get recent activities (last 5)
    const activities = [];
    
    // Add product additions
    allProducts.slice(-3).forEach(product => {
        activities.push({
            type: 'product',
            message: `Added product: ${product.name}`,
            time: 'Recently'
        });
    });
    
    // Add service additions
    allServices.slice(-2).forEach(service => {
        activities.push({
            type: 'service',
            message: `Added service: ${service.name}`,
            time: 'Recently'
        });
    });
    
    // Add recent bookings
    allBookings.slice(-2).forEach(booking => {
        activities.push({
            type: 'booking',
            message: `New booking: ${booking.serviceName} for ${booking.customerName}`,
            time: 'Today'
        });
    });
    
    // Sort by time (mock) and take 5
    const recentActivities = activities.slice(-5).reverse();
    
    if (recentActivities.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <i class="fas fa-info-circle"></i>
                <div class="activity-content">
                    <p>No recent activity. Start managing your salon!</p>
                    <small>Just now</small>
                </div>
            </div>
        `;
        return;
    }
    
    activityList.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            <div class="activity-content">
                <p>${activity.message}</p>
                <small>${activity.time}</small>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    switch(type) {
        case 'product': return 'shopping-bag';
        case 'service': return 'spa';
        case 'booking': return 'calendar-check';
        default: return 'info-circle';
    }
}

// ====== PRODUCTS MANAGEMENT ======

function renderProductsTable() {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;
    
    if (allProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-shopping-bag"></i>
                        <p>No products found</p>
                        <button class="action-btn primary" onclick="openProductModal()">
                            <i class="fas fa-plus"></i> Add First Product
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = allProducts.map(product => `
        <tr>
            <td>
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" class="table-image">` :
                    `<div class="table-icon"><i class="fas fa-image"></i></div>`
                }
            </td>
            <td>
                <strong>${product.name}</strong>
                <div class="text-muted small">${product.description?.substring(0, 50)}...</div>
            </td>
            <td>
                <span class="category-badge">${product.category}</span>
            </td>
            <td>
                <strong class="price">Ksh ${typeof product.price === 'number' ? product.price.toLocaleString() : product.price}</strong>
            </td>
            <td>
                <span class="stock ${product.stock < 5 ? 'low-stock' : ''}">
                    ${product.stock || 0} items
                </span>
            </td>
            <td>
                <span class="status-badge ${product.stock > 0 ? 'status-active' : 'status-inactive'}">
                    ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editProduct('${product.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-btn delete" onclick="deleteProduct('${product.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openProductModal(product = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');
    const productId = document.getElementById('product-id');
    
    if (product) {
        // Edit mode
        title.textContent = 'Edit Product';
        productId.value = product.id;
        
        // Fill form fields
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock || 0;
        document.getElementById('product-description').value = product.description || '';
        
        // Show current image
        if (product.image) {
            const currentImageSection = document.getElementById('current-image-section');
            const currentImagePreview = document.getElementById('current-image-preview');
            
            currentImagePreview.innerHTML = `<img src="${product.image}" alt="${product.name}">`;
            currentImageSection.style.display = 'block';
        }
        
        // Set form action
        form.onsubmit = (e) => updateProduct(e, product.id);
    } else {
        // Add mode
        title.textContent = 'Add New Product';
        productId.value = '';
        form.reset();
        
        // Hide current image section
        document.getElementById('current-image-section').style.display = 'none';
        
        // Clear image previews
        document.getElementById('upload-preview').innerHTML = '';
        document.getElementById('url-preview').innerHTML = '';
        
        // Set form action
        form.onsubmit = addProduct;
    }
    
    // Load public images
    loadPublicImages();
    
    // Setup image upload
    setupImageUpload();
    
    // Show modal
    modal.classList.add('active');
}

function setupImageUpload() {
    const uploadArea = document.getElementById('image-upload-area');
    const fileInput = document.getElementById('image-upload');
    const preview = document.getElementById('upload-preview');
    const urlInput = document.getElementById('image-url');
    const urlPreview = document.getElementById('url-preview');
    const loadUrlBtn = document.getElementById('load-image-url');
    
    // File upload
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-pink)';
        uploadArea.style.background = 'rgba(255, 20, 147, 0.05)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageFile(file);
        } else {
            showToast('Please upload an image file', 'error');
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageFile(file);
        }
    });
    
    // URL image
    loadUrlBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (url) {
            urlPreview.innerHTML = `<img src="${url}" alt="URL Image" onerror="this.onerror=null;this.src='https://via.placeholder.com/400x300?text=Image+Not+Found'">`;
        }
    });
    
    // Public images selection
    const publicImagesGrid = document.getElementById('public-images');
    publicImagesGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('public-image')) {
            // Remove selection from all
            document.querySelectorAll('.public-image').forEach(img => {
                img.classList.remove('selected');
            });
            
            // Add selection to clicked
            e.target.classList.add('selected');
            
            // Show in preview
            urlPreview.innerHTML = `<img src="${e.target.src}" alt="Selected Image">`;
            urlInput.value = e.target.src;
        }
    });
}

function handleImageFile(file) {
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showToast('Image size should be less than 2MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('upload-preview');
        preview.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image">`;
        
        // Also set as URL for form submission
        document.getElementById('image-url').value = e.target.result;
    };
    reader.readAsDataURL(file);
}

function loadPublicImages() {
    const grid = document.getElementById('public-images');
    if (!grid) return;
    
    grid.innerHTML = PUBLIC_IMAGES.map(img => `
        <img src="${img.url}" 
             alt="${img.title}" 
             class="public-image"
             title="${img.title} (${img.category})">
    `).join('');
}

async function addProduct(e) {
    e.preventDefault();
    
    const formData = {
        id: 'prod_' + Date.now(),
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        price: parseInt(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value) || 0,
        description: document.getElementById('product-description').value,
        image: document.getElementById('image-url').value || ''
    };
    
    // Validation
    if (!formData.name || !formData.category || !formData.price) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        // Try to save to backend
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.products}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            allProducts.push(formData);
            localStorage.setItem('salon_products', JSON.stringify(allProducts));
            
            showToast('Product added successfully!', 'success');
            closeModal('product-modal');
            renderProductsTable();
            updateDashboardStats();
            
            // Add to activity
            addActivity('product', `Added product: ${formData.name}`);
            
        } else {
            throw new Error('Failed to save to backend');
        }
    } catch (error) {
        console.log('Saving product locally...');
        allProducts.push(formData);
        localStorage.setItem('salon_products', JSON.stringify(allProducts));
        
        showToast('Product saved locally (backend offline)', 'info');
        closeModal('product-modal');
        renderProductsTable();
        updateDashboardStats();
    }
}

async function updateProduct(e, productId) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        price: parseInt(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value) || 0,
        description: document.getElementById('product-description').value,
        image: document.getElementById('image-url').value || ''
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.products}/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            // Update in local array
            const index = allProducts.findIndex(p => p.id === productId);
            if (index !== -1) {
                allProducts[index] = { ...allProducts[index], ...formData };
                localStorage.setItem('salon_products', JSON.stringify(allProducts));
            }
            
            showToast('Product updated successfully!', 'success');
            closeModal('product-modal');
            renderProductsTable();
            
            addActivity('product', `Updated product: ${formData.name}`);
            
        } else {
            throw new Error('Failed to update on backend');
        }
    } catch (error) {
        console.log('Updating product locally...');
        const index = allProducts.findIndex(p => p.id === productId);
        if (index !== -1) {
            allProducts[index] = { ...allProducts[index], ...formData };
            localStorage.setItem('salon_products', JSON.stringify(allProducts));
        }
        
        showToast('Product updated locally (backend offline)', 'info');
        closeModal('product-modal');
        renderProductsTable();
    }
}

function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        openProductModal(product);
    }
}

function deleteProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    deleteCallback = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.products}/${productId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                allProducts = allProducts.filter(p => p.id !== productId);
                localStorage.setItem('salon_products', JSON.stringify(allProducts));
                
                showToast('Product deleted successfully', 'success');
                renderProductsTable();
                updateDashboardStats();
                
                addActivity('product', `Deleted product: ${product.name}`);
                
            } else {
                throw new Error('Failed to delete from backend');
            }
        } catch (error) {
            console.log('Deleting product locally...');
            allProducts = allProducts.filter(p => p.id !== productId);
            localStorage.setItem('salon_products', JSON.stringify(allProducts));
            
            showToast('Product deleted locally (backend offline)', 'info');
            renderProductsTable();
            updateDashboardStats();
        }
    };
    
    deleteItemId = productId;
    deleteItemType = 'product';
    
    document.getElementById('delete-message').textContent = 
        `Are you sure you want to delete "${product.name}"? This action cannot be undone.`;
    
    openModal('delete-modal');
}

function filterProducts() {
    const searchTerm = document.getElementById('search-products').value.toLowerCase();
    const category = document.getElementById('product-category-filter').value;
    
    const filtered = allProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            (product.description && product.description.toLowerCase().includes(searchTerm));
        const matchesCategory = category === 'all' || product.category === category;
        return matchesSearch && matchesCategory;
    });
    
    renderFilteredProducts(filtered);
}

function renderFilteredProducts(filteredProducts) {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;
    
    if (filteredProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>No products match your search</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredProducts.map(product => `
        <tr>
            <td>
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" class="table-image">` :
                    `<div class="table-icon"><i class="fas fa-image"></i></div>`
                }
            </td>
            <td>
                <strong>${product.name}</strong>
                <div class="text-muted small">${product.description?.substring(0, 50)}...</div>
            </td>
            <td>
                <span class="category-badge">${product.category}</span>
            </td>
            <td>
                <strong class="price">Ksh ${typeof product.price === 'number' ? product.price.toLocaleString() : product.price}</strong>
            </td>
            <td>
                <span class="stock ${product.stock < 5 ? 'low-stock' : ''}">
                    ${product.stock || 0} items
                </span>
            </td>
            <td>
                <span class="status-badge ${product.stock > 0 ? 'status-active' : 'status-inactive'}">
                    ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-btn delete" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ====== SERVICES MANAGEMENT ======

function renderServicesTable() {
    const tbody = document.getElementById('services-tbody');
    if (!tbody) return;
    
    if (allServices.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-spa"></i>
                        <p>No services found</p>
                        <button class="action-btn primary" onclick="openServiceModal()">
                            <i class="fas fa-plus"></i> Add First Service
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = allServices.map(service => `
        <tr>
            <td>
                <div class="table-icon large">${service.icon || '💅'}</div>
            </td>
            <td>
                <strong>${service.name}</strong>
                <div class="text-muted small">${service.description?.substring(0, 50)}...</div>
            </td>
            <td>
                <span class="category-badge">${service.category}</span>
            </td>
            <td>
                <strong class="price">Ksh ${typeof service.price === 'number' ? service.price.toLocaleString() : service.price}</strong>
            </td>
            <td>${service.duration || '45 min'}</td>
            <td>
                <span class="status-badge status-active">Active</span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editService('${service.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-btn delete" onclick="deleteService('${service.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openServiceModal(service = null) {
    const modal = document.getElementById('service-modal');
    const title = document.getElementById('service-modal-title');
    const form = document.getElementById('service-form');
    const serviceId = document.getElementById('service-id');
    
    if (service) {
        // Edit mode
        title.textContent = 'Edit Service';
        serviceId.value = service.id;
        
        // Fill form fields
        document.getElementById('service-name').value = service.name;
        document.getElementById('service-category').value = service.category;
        document.getElementById('service-price').value = service.price;
        document.getElementById('service-duration').value = service.duration || '45 min';
        document.getElementById('service-description').value = service.description || '';
        
        // Set selected icon
        document.querySelectorAll('.icon-option').forEach(option => {
            option.classList.remove('selected');
            if (option.getAttribute('data-icon') === service.icon) {
                option.classList.add('selected');
            }
        });
        document.getElementById('selected-icon-preview').textContent = service.icon || '💇';
        
        // Set form action
        form.onsubmit = (e) => updateService(e, service.id);
    } else {
        // Add mode
        title.textContent = 'Add New Service';
        serviceId.value = '';
        form.reset();
        
        // Reset icon selection
        document.querySelectorAll('.icon-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.getElementById('selected-icon-preview').textContent = '💇';
        
        // Set form action
        form.onsubmit = addService;
    }
    
    // Setup icon selection
    setupIconSelection();
    
    // Show modal
    modal.classList.add('active');
}

function setupIconSelection() {
    const iconsGrid = document.getElementById('icons-grid');
    const selectedIconPreview = document.getElementById('selected-icon-preview');
    
    iconsGrid.addEventListener('click', (e) => {
        const iconOption = e.target.closest('.icon-option');
        if (iconOption) {
            // Remove selection from all
            document.querySelectorAll('.icon-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // Add selection to clicked
            iconOption.classList.add('selected');
            
            // Update preview
            selectedIconPreview.textContent = iconOption.getAttribute('data-icon');
        }
    });
}

async function addService(e) {
    e.preventDefault();
    
    const selectedIcon = document.querySelector('.icon-option.selected');
    
    const formData = {
        id: 'serv_' + Date.now(),
        name: document.getElementById('service-name').value,
        category: document.getElementById('service-category').value,
        price: parseInt(document.getElementById('service-price').value),
        duration: document.getElementById('service-duration').value,
        description: document.getElementById('service-description').value,
        icon: selectedIcon ? selectedIcon.getAttribute('data-icon') : '💇'
    };
    
    // Validation
    if (!formData.name || !formData.category || !formData.price) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.services}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            allServices.push(formData);
            localStorage.setItem('salon_services', JSON.stringify(allServices));
            
            showToast('Service added successfully!', 'success');
            closeModal('service-modal');
            renderServicesTable();
            updateDashboardStats();
            
            addActivity('service', `Added service: ${formData.name}`);
            
        } else {
            throw new Error('Failed to save to backend');
        }
    } catch (error) {
        console.log('Saving service locally...');
        allServices.push(formData);
        localStorage.setItem('salon_services', JSON.stringify(allServices));
        
        showToast('Service saved locally (backend offline)', 'info');
        closeModal('service-modal');
        renderServicesTable();
        updateDashboardStats();
    }
}

async function updateService(e, serviceId) {
    e.preventDefault();
    
    const selectedIcon = document.querySelector('.icon-option.selected');
    
    const formData = {
        name: document.getElementById('service-name').value,
        category: document.getElementById('service-category').value,
        price: parseInt(document.getElementById('service-price').value),
        duration: document.getElementById('service-duration').value,
        description: document.getElementById('service-description').value,
        icon: selectedIcon ? selectedIcon.getAttribute('data-icon') : '💇'
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.services}/${serviceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const index = allServices.findIndex(s => s.id === serviceId);
            if (index !== -1) {
                allServices[index] = { ...allServices[index], ...formData };
                localStorage.setItem('salon_services', JSON.stringify(allServices));
            }
            
            showToast('Service updated successfully!', 'success');
            closeModal('service-modal');
            renderServicesTable();
            
            addActivity('service', `Updated service: ${formData.name}`);
            
        } else {
            throw new Error('Failed to update on backend');
        }
    } catch (error) {
        console.log('Updating service locally...');
        const index = allServices.findIndex(s => s.id === serviceId);
        if (index !== -1) {
            allServices[index] = { ...allServices[index], ...formData };
            localStorage.setItem('salon_services', JSON.stringify(allServices));
        }
        
        showToast('Service updated locally (backend offline)', 'info');
        closeModal('service-modal');
        renderServicesTable();
    }
}

function editService(serviceId) {
    const service = allServices.find(s => s.id === serviceId);
    if (service) {
        openServiceModal(service);
    }
}

function deleteService(serviceId) {
    const service = allServices.find(s => s.id === serviceId);
    if (!service) return;
    
    deleteCallback = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.services}/${serviceId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                allServices = allServices.filter(s => s.id !== serviceId);
                localStorage.setItem('salon_services', JSON.stringify(allServices));
                
                showToast('Service deleted successfully', 'success');
                renderServicesTable();
                updateDashboardStats();
                
                addActivity('service', `Deleted service: ${service.name}`);
                
            } else {
                throw new Error('Failed to delete from backend');
            }
        } catch (error) {
            console.log('Deleting service locally...');
            allServices = allServices.filter(s => s.id !== serviceId);
            localStorage.setItem('salon_services', JSON.stringify(allServices));
            
            showToast('Service deleted locally (backend offline)', 'info');
            renderServicesTable();
            updateDashboardStats();
        }
    };
    
    deleteItemId = serviceId;
    deleteItemType = 'service';
    
    document.getElementById('delete-message').textContent = 
        `Are you sure you want to delete "${service.name}"? This action cannot be undone.`;
    
    openModal('delete-modal');
}

// ====== BOOKINGS MANAGEMENT ======

function renderBookingsTable() {
    const tbody = document.getElementById('bookings-tbody');
    if (!tbody) return;
    
    if (allBookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-calendar-check"></i>
                        <p>No bookings found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = allBookings.map(booking => `
        <tr>
            <td>
                <span class="booking-id">#${booking.id?.substring(0, 8) || 'N/A'}</span>
            </td>
            <td>
                <strong>${booking.customerName || 'N/A'}</strong>
            </td>
            <td>${booking.serviceName || 'N/A'}</td>
            <td>
                <div>${formatDate(booking.date)}</div>
                <div class="text-muted small">${booking.time || ''}</div>
            </td>
            <td>
                <div>${booking.customerPhone || 'N/A'}</div>
                ${booking.customerEmail ? `<div class="text-muted small">${booking.customerEmail}</div>` : ''}
            </td>
            <td>
                <strong>Ksh ${(booking.price || 0).toLocaleString()}</strong>
            </td>
            <td>
                <span class="status-badge status-${booking.status || 'pending'}">
                    ${(booking.status || 'pending').charAt(0).toUpperCase() + (booking.status || 'pending').slice(1)}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editBooking('${booking.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-btn delete" onclick="deleteBooking('${booking.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openBookingModal(booking = null) {
    // This would open the booking modal
    // Similar to product/service modals but for bookings
    showToast('Booking modal would open here', 'info');
}

function filterBookings() {
    const status = document.getElementById('booking-status-filter').value;
    
    const filtered = allBookings.filter(booking => {
        return status === 'all' || booking.status === status;
    });
    
    renderFilteredBookings(filtered);
}

// ====== ORDERS MANAGEMENT ======

function renderOrdersTable() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;
    
    if (allOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-shopping-cart"></i>
                        <p>No orders found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = allOrders.map(order => `
        <tr>
            <td>
                <span class="order-id">#${order.id?.substring(0, 8) || 'N/A'}</span>
            </td>
            <td>${order.customerName || 'N/A'}</td>
            <td>
                <div>${order.items?.length || 0} items</div>
                <div class="text-muted small">${order.items?.[0]?.name || ''}</div>
            </td>
            <td>
                <strong>Ksh ${(order.total || 0).toLocaleString()}</strong>
            </td>
            <td>
                <span class="method-badge">${order.method || 'whatsapp'}</span>
            </td>
            <td>${formatDate(order.date || order.createdAt)}</td>
            <td>
                <span class="status-badge status-completed">Completed</span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="table-btn view" onclick="viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ====== SETTINGS FUNCTIONS ======

function saveGeneralSettings(e) {
    e.preventDefault();
    
    const settings = {
        salonName: document.getElementById('salon-name').value,
        salonPhone: document.getElementById('salon-phone').value,
        salonEmail: document.getElementById('salon-email').value,
        salonAddress: document.getElementById('salon-address').value,
        workingHours: document.getElementById('working-hours').value
    };
    
    localStorage.setItem('salon_settings', JSON.stringify(settings));
    showToast('Settings saved successfully!', 'success');
    
    addActivity('settings', 'Updated salon settings');
}

async function changePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('New password must be at least 6 characters', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    // Verify current password
    const storedHash = localStorage.getItem('admin_password');
    const defaultPassword = 'salon@2024';
    
    const isCurrentValid = (currentPassword === defaultPassword) || 
                          (storedHash && storedHash === hashPassword(currentPassword));
    
    if (!isCurrentValid) {
        showToast('Current password is incorrect', 'error');
        return;
    }
    
    // Update password
    const newHash = hashPassword(newPassword);
    localStorage.setItem('admin_password', newHash);
    
    // Clear form
    e.target.reset();
    
    showToast('Password changed successfully! Please login again.', 'success');
    
    // Logout after 2 seconds
    setTimeout(() => {
        handleLogout();
    }, 2000);
    
    addActivity('security', 'Changed admin password');
}

function createBackup() {
    const backupData = {
        products: allProducts,
        services: allServices,
        bookings: allBookings,
        orders: allOrders,
        settings: JSON.parse(localStorage.getItem('salon_settings') || '{}'),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    };
    
    const backup = {
        id: 'backup_' + Date.now(),
        data: backupData,
        created: new Date().toLocaleString()
    };
    
    // Save to localStorage
    const backups = JSON.parse(localStorage.getItem('salon_backups') || '[]');
    backups.push(backup);
    localStorage.setItem('salon_backups', JSON.stringify(backups));
    
    // Update backup list
    updateBackupList();
    
    showToast('Backup created successfully!', 'success');
    addActivity('backup', 'Created system backup');
}

function downloadBackup() {
    const backupData = {
        products: allProducts,
        services: allServices,
        bookings: allBookings,
        orders: allOrders,
        settings: JSON.parse(localStorage.getItem('salon_settings') || '{}'),
        timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `salon_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Backup downloaded!', 'success');
    addActivity('backup', 'Downloaded backup file');
}

function restoreBackup() {
    const fileInput = document.getElementById('restore-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('Please select a backup file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);
            
            // Validate backup data
            if (!backupData.products || !backupData.services) {
                throw new Error('Invalid backup file format');
            }
            
            // Restore data
            allProducts = backupData.products;
            allServices = backupData.services;
            allBookings = backupData.bookings || [];
            allOrders = backupData.orders || [];
            
            // Save to localStorage
            localStorage.setItem('salon_products', JSON.stringify(allProducts));
            localStorage.setItem('salon_services', JSON.stringify(allServices));
            localStorage.setItem('salon_bookings', JSON.stringify(allBookings));
            localStorage.setItem('salon_orders', JSON.stringify(allOrders));
            
            if (backupData.settings) {
                localStorage.setItem('salon_settings', JSON.stringify(backupData.settings));
            }
            
            // Update UI
            renderProductsTable();
            renderServicesTable();
            renderBookingsTable();
            renderOrdersTable();
            updateDashboardStats();
            
            showToast('Backup restored successfully!', 'success');
            addActivity('backup', 'Restored system from backup');
            
        } catch (error) {
            console.error('Error restoring backup:', error);
            showToast('Error restoring backup: Invalid file format', 'error');
        }
    };
    reader.readAsText(file);
}

function updateBackupList() {
    const backupList = document.getElementById('backup-list');
    if (!backupList) return;
    
    const backups = JSON.parse(localStorage.getItem('salon_backups') || '[]');
    
    if (backups.length === 0) {
        backupList.innerHTML = `
            <div class="backup-item">
                <i class="fas fa-history"></i>
                <div>
                    <p>No backups created yet</p>
                    <small>Create your first backup</small>
                </div>
            </div>
        `;
        return;
    }
    
    // Show last 3 backups
    const recentBackups = backups.slice(-3).reverse();
    
    backupList.innerHTML = recentBackups.map(backup => `
        <div class="backup-item">
            <i class="fas fa-database"></i>
            <div>
                <p>Backup: ${backup.created}</p>
                <small>${backup.data.products.length} products, ${backup.data.services.length} services</small>
            </div>
        </div>
    `).join('');
}

function clearCache() {
    // Clear all localStorage except admin login
    const adminLoggedIn = localStorage.getItem('admin_logged_in');
    const adminPassword = localStorage.getItem('admin_password');
    const adminSessionTime = localStorage.getItem('admin_session_time');
    
    localStorage.clear();
    
    // Restore admin data
    if (adminLoggedIn) localStorage.setItem('admin_logged_in', adminLoggedIn);
    if (adminPassword) localStorage.setItem('admin_password', adminPassword);
    if (adminSessionTime) localStorage.setItem('admin_session_time', adminSessionTime);
    
    // Reload default data
    initializeDefaultData();
    
    showToast('Cache cleared successfully!', 'success');
    addActivity('system', 'Cleared application cache');
}

function runSystemCheck() {
    const checks = [
        { name: 'Backend Connection', status: checkBackendConnection() ? '✅' : '⚠️' },
        { name: 'Local Storage', status: '✅' },
        { name: 'Default Data', status: allProducts.length > 0 && allServices.length > 0 ? '✅' : '⚠️' },
        { name: 'Admin Login', status: localStorage.getItem('admin_logged_in') ? '✅' : '⚠️' }
    ];
    
    const results = checks.map(check => `${check.name}: ${check.status}`).join('\n');
    
    showToast(`System Check Complete:\n${results}`, 'info');
    addActivity('system', 'Ran system diagnostic check');
}

// ====== EXPORT FUNCTIONS ======

function exportData(type, format) {
    let data, filename, mimeType;
    
    switch(type) {
        case 'products':
            data = allProducts;
            filename = `products_${new Date().toISOString().split('T')[0]}`;
            break;
        case 'services':
            data = allServices;
            filename = `services_${new Date().toISOString().split('T')[0]}`;
            break;
        case 'bookings':
            data = allBookings;
            filename = `bookings_${new Date().toISOString().split('T')[0]}`;
            break;
        case 'all':
            data = {
                products: allProducts,
                services: allServices,
                bookings: allBookings,
                orders: allOrders,
                exported: new Date().toISOString()
            };
            filename = `salon_full_backup_${new Date().toISOString().split('T')[0]}`;
            break;
        default:
            return;
    }
    
    if (format === 'json') {
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        mimeType = 'application/json';
        filename += '.json';
        
        downloadFile(dataUri, filename);
        
    } else if (format === 'csv') {
        if (type === 'all') {
            showToast('CSV export not available for full backup. Use JSON instead.', 'warning');
            return;
        }
        
        const csv = convertToCSV(data);
        const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csv);
        mimeType = 'text/csv';
        filename += '.csv';
        
        downloadFile(dataUri, filename);
    }
    
    showToast(`${type.toUpperCase()} exported as ${format.toUpperCase()}!`, 'success');
    addActivity('export', `Exported ${type} as ${format}`);
}

function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => 
        headers.map(header => {
            const value = obj[header];
            // Handle nested objects and arrays
            if (typeof value === 'object') {
                return JSON.stringify(value);
            }
            return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
}

function downloadFile(dataUri, filename) {
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', filename);
    link.click();
}

// ====== UTILITY FUNCTIONS ======

function switchSection(section) {
    // Update active nav item
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === section) {
            item.classList.add('active');
        }
    });
    
    // Show active content section
    contentSections.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${section}-content`) {
            content.classList.add('active');
        }
    });
    
    currentSection = section;
    
    // Load section-specific data
    switch(section) {
        case 'products':
            loadProducts();
            break;
        case 'services':
            loadServices();
            break;
        case 'bookings':
            loadBookings();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'export':
            updateBackupList();
            break;
    }
    
    // Update page title
    document.title = `Salon Admin - ${section.charAt(0).toUpperCase() + section.slice(1)}`;
}

function handleQuickAction(action) {
    switch(action) {
        case 'add-product':
            openProductModal();
            break;
        case 'add-service':
            openServiceModal();
            break;
        case 'view-bookings':
            switchSection('bookings');
            break;
        case 'export-data':
            switchSection('export');
            break;
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

function confirmDelete() {
    if (deleteCallback) {
        deleteCallback();
        deleteCallback = null;
        deleteItemId = null;
        deleteItemType = null;
    }
    closeModal('delete-modal');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${getToastIcon(type)}"></i>
        <div class="toast-content">
            <p>${message}</p>
        </div>
        <button class="close-toast">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Add show class after a delay
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Close button
    toast.querySelector('.close-toast').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

function hashPassword(password) {
    // Simple hash function for demo purposes
    // In production, use a proper hashing library
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

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

function addActivity(type, message) {
    const activities = JSON.parse(localStorage.getItem('salon_activities') || '[]');
    activities.push({
        type,
        message,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 activities
    if (activities.length > 50) {
        activities.shift();
    }
    
    localStorage.setItem('salon_activities', JSON.stringify(activities));
    
    // Refresh activity display if on dashboard
    if (currentSection === 'dashboard') {
        loadRecentActivity();
    }
}

async function checkBackendConnection() {
    try {
        const response = await fetch(API_BASE_URL, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        return false;
    }
}

function initializeDefaultData() {
    // Load default data if none exists
    if (!localStorage.getItem('salon_products')) {
        localStorage.setItem('salon_products', JSON.stringify(DEFAULT_PRODUCTS));
        allProducts = [...DEFAULT_PRODUCTS];
    }
    
    if (!localStorage.getItem('salon_services')) {
        localStorage.setItem('salon_services', JSON.stringify(DEFAULT_SERVICES));
        allServices = [...DEFAULT_SERVICES];
    }
    
    if (!localStorage.getItem('salon_settings')) {
        const defaultSettings = {
            salonName: 'Salon Elegance',
            salonPhone: '0705 455 312',
            salonEmail: 'info@salonelegance.com',
            salonAddress: 'Nairobi, Kenya',
            workingHours: 'Mon-Sat: 8AM-8PM'
        };
        localStorage.setItem('salon_settings', JSON.stringify(defaultSettings));
    }
    
    // Load stored data
    const storedProducts = localStorage.getItem('salon_products');
    const storedServices = localStorage.getItem('salon_services');
    
    if (storedProducts) allProducts = JSON.parse(storedProducts);
    if (storedServices) allServices = JSON.parse(storedServices);
}

function loadLocalData() {
    // Load all data from localStorage
    const products = localStorage.getItem('salon_products');
    const services = localStorage.getItem('salon_services');
    const bookings = localStorage.getItem('salon_bookings');
    const orders = localStorage.getItem('salon_orders');
    
    if (products) allProducts = JSON.parse(products);
    if (services) allServices = JSON.parse(services);
    if (bookings) allBookings = JSON.parse(bookings);
    if (orders) allOrders = JSON.parse(orders);
    
    updateDashboardStats();
    updateNavCounts();
    loadRecentActivity();
}

function updateNavCounts() {
    if (productsCount) productsCount.textContent = allProducts.length;
    if (servicesCount) servicesCount.textContent = allServices.length;
    if (bookingsCount) bookingsCount.textContent = allBookings.length;
    if (ordersCount) ordersCount.textContent = allOrders.length;
}

// Make functions available globally
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.editService = editService;
window.deleteService = deleteService;
window.openProductModal = openProductModal;
window.openServiceModal = openServiceModal;
window.viewOrder = function(orderId) {
    showToast(`Viewing order ${orderId}`, 'info');
};

// Initialize on load
setTimeout(() => {
    if (currentSection === 'dashboard') {
        loadRecentActivity();
    }
}, 1000);
