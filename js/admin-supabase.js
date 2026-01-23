// admin-supabase.js - Complete Admin Dashboard with Supabase
// DIRECT Supabase Connection - NO backend server needed!

// ====== CONFIGURATION ======
const DEFAULT_ADMIN_PASSWORD = 'salon@2024';
const BUCKET_NAME = 'product-images';

// ====== GLOBAL VARIABLES ======
let currentUser = null;
let allProducts = [];
let allServices = [];
let allBookings = [];
let allOrders = [];
let currentSection = 'dashboard';

// ====== DOM ELEMENTS ======
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const adminPasswordInput = document.getElementById('admin-password');
const logoutBtn = document.getElementById('logout-btn');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('dashboard-sidebar');
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin panel initializing with Supabase...');
    
    checkLoginStatus();
    setupEventListeners();
    await checkSupabaseConnection();
    
    // Load data if logged in
    if (localStorage.getItem('admin_logged_in') === 'true') {
        await loadDashboardData();
    }
});

// ====== SUPABASE CONNECTION ======
async function checkSupabaseConnection() {
    try {
        // Test connection
        const { data, error } = await supabaseClient
            .from('products')
            .select('count')
            .limit(1);
        
        if (error) throw error;
        console.log('✅ Supabase connection successful');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error);
        showToast('Supabase connection failed. Using offline mode.', 'warning');
        return false;
    }
}

// ====== AUTHENTICATION ======
async function handleLogin(e) {
    if (e) e.preventDefault();
    
    const password = adminPasswordInput?.value || '';
    
    if (!password) {
        showToast('Please enter password', 'error');
        return;
    }
    
    try {
        // Try Supabase first
        const { data: adminData, error } = await supabaseClient
            .from('admin_settings')
            .select('*')
            .limit(1)
            .single();
        
        let isValid = false;
        
        if (error || !adminData) {
            // First time setup
            if (password === DEFAULT_ADMIN_PASSWORD) {
                isValid = true;
                await setupDefaultAdmin(password);
            }
        } else {
            // Check password
            isValid = checkPassword(password, adminData.password_hash);
        }
        
        if (isValid) {
            localStorage.setItem('admin_logged_in', 'true');
            localStorage.setItem('admin_session_time', Date.now().toString());
            
            showToast('Login successful!', 'success');
            showDashboard();
            await loadDashboardData();
        } else {
            showToast('Incorrect password', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        // Fallback to localStorage
        const storedHash = localStorage.getItem('admin_password_hash');
        if (password === DEFAULT_ADMIN_PASSWORD || 
            (storedHash && checkPassword(password, storedHash))) {
            
            localStorage.setItem('admin_logged_in', 'true');
            localStorage.setItem('admin_session_time', Date.now().toString());
            
            showToast('Login successful (offline mode)!', 'success');
            showDashboard();
            loadLocalData();
        } else {
            showToast('Incorrect password', 'error');
        }
    }
}

async function setupDefaultAdmin(password) {
    try {
        const passwordHash = hashPassword(password);
        
        const { error } = await supabaseClient
            .from('admin_settings')
            .upsert({
                id: 'admin_001',
                password_hash: passwordHash,
                salon_name: 'Salon Elegance',
                salon_phone: '0705 455 312',
                salon_email: 'info@salonelegance.com',
                salon_address: 'Nairobi, Kenya',
                working_hours: 'Mon-Sat: 8AM-8PM',
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        // Also save locally as backup
        localStorage.setItem('admin_password_hash', passwordHash);
        
    } catch (error) {
        console.error('Admin setup error:', error);
    }
}

function handleLogout() {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_session_time');
    showToast('Logged out successfully', 'success');
    showLogin();
}

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
    const sessionTime = localStorage.getItem('admin_session_time');
    
    // 30-minute session timeout
    if (sessionTime && (Date.now() - parseInt(sessionTime)) > 30 * 60 * 1000) {
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_session_time');
        showLogin();
    } else if (isLoggedIn) {
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    if (loginSection) loginSection.classList.add('active');
    if (dashboardSection) dashboardSection.classList.remove('active');
    if (loginForm) loginForm.reset();
}

function showDashboard() {
    if (loginSection) loginSection.classList.remove('active');
    if (dashboardSection) dashboardSection.classList.add('active');
    updateSessionTime();
}

function updateSessionTime() {
    localStorage.setItem('admin_session_time', Date.now().toString());
}

// ====== DASHBOARD FUNCTIONS ======
async function loadDashboardData() {
    try {
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
        console.error('Dashboard load error:', error);
        loadLocalData();
    }
}

function updateDashboardStats() {
    // Update counts
    const statProducts = document.getElementById('stat-products');
    const statServices = document.getElementById('stat-services');
    const statBookings = document.getElementById('stat-bookings');
    const statRevenue = document.getElementById('stat-revenue');
    
    if (statProducts) statProducts.textContent = allProducts.length;
    if (statServices) statServices.textContent = allServices.length;
    
    // TODAY'S BOOKINGS - FIXED!
    const todaysBookings = getTodaysBookings();
    if (statBookings) statBookings.textContent = todaysBookings.length;
    
    // Total revenue
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    if (statRevenue) statRevenue.textContent = `Ksh ${totalRevenue.toLocaleString()}`;
    
    // Update nav counts
    updateNavCounts();
}

function getTodaysBookings() {
    const today = new Date().toISOString().split('T')[0]; // Format: "2024-01-23"
    console.log('Checking bookings for today:', today);
    console.log('All bookings:', allBookings);
    
    const todaysBookings = allBookings.filter(booking => {
        // Handle different date formats
        const bookingDate = booking.date ? 
            (booking.date.split('T')[0] || booking.date) : 
            null;
        return bookingDate === today;
    });
    
    console.log('Today\'s bookings found:', todaysBookings.length);
    return todaysBookings;
}

function updateNavCounts() {
    const productsCount = document.getElementById('products-count');
    const servicesCount = document.getElementById('services-count');
    const bookingsCount = document.getElementById('bookings-count');
    const ordersCount = document.getElementById('orders-count');
    
    if (productsCount) productsCount.textContent = allProducts.length;
    if (servicesCount) servicesCount.textContent = allServices.length;
    if (bookingsCount) bookingsCount.textContent = allBookings.length;
    if (ordersCount) ordersCount.textContent = allOrders.length;
}

// ====== PRODUCTS MANAGEMENT (FIXED FORM) ======
async function loadProducts() {
    try {
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allProducts = products || [];
        
        // Save to localStorage as backup
        localStorage.setItem('salon_products', JSON.stringify(allProducts));
        
        renderProductsTable();
        updateDashboardStats();
        
        return allProducts;
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to localStorage
        return loadProductsFromLocal();
    }
}

function loadProductsFromLocal() {
    const localProducts = localStorage.getItem('salon_products');
    if (localProducts) {
        allProducts = JSON.parse(localProducts);
    } else {
        allProducts = [];
    }
    
    renderProductsTable();
    updateDashboardStats();
    return allProducts;
}

// FIXED: Open Product Modal Function
function openProductModal(product = null) {
    console.log('Opening product modal for:', product ? 'edit' : 'add');
    
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');
    
    if (!modal || !title || !form) {
        console.error('Product modal elements not found!');
        showToast('Error: Product form not found', 'error');
        return;
    }
    
    if (product) {
        // Edit mode
        title.textContent = 'Edit Product';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name || '';
        document.getElementById('product-category').value = product.category || 'wigs';
        document.getElementById('product-price').value = product.price || '';
        document.getElementById('product-stock').value = product.stock || 0;
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('image-url').value = product.image_url || product.image || '';
        
        // Show current image
        const currentImage = product.image_url || product.image;
        if (currentImage) {
            const urlPreview = document.getElementById('url-preview');
            if (urlPreview) {
                urlPreview.innerHTML = `<img src="${currentImage}" alt="Current Image" style="max-width:200px;border-radius:8px;">`;
            }
        }
        
        // Set form submit handler
        form.onsubmit = (e) => {
            e.preventDefault();
            handleProductSubmit(e, product.id);
        };
        
    } else {
        // Add mode
        title.textContent = 'Add New Product';
        form.reset();
        document.getElementById('product-id').value = '';
        
        // Clear preview
        const urlPreview = document.getElementById('url-preview');
        if (urlPreview) urlPreview.innerHTML = '';
        
        // Set form submit handler
        form.onsubmit = (e) => {
            e.preventDefault();
            handleProductSubmit(e);
        };
    }
    
    // Setup image upload
    setupImageUpload();
    
    // Show modal
    modal.classList.add('active');
    console.log('Product modal opened successfully');
}

async function handleProductSubmit(e, productId = null) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value) || 0,
        description: document.getElementById('product-description').value,
        image_url: document.getElementById('image-url').value
    };
    
    // Validation
    if (!formData.name || !formData.category || !formData.price) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        // Get image file
        const imageInput = document.getElementById('image-upload');
        let imageFile = null;
        if (imageInput && imageInput.files && imageInput.files[0]) {
            imageFile = imageInput.files[0];
        }
        
        if (productId) {
            await updateProduct(productId, formData, imageFile);
        } else {
            await addProduct(formData, imageFile);
        }
        
        closeModal('product-modal');
        
    } catch (error) {
        console.error('Product submit error:', error);
        showToast('Failed to save product: ' + error.message, 'error');
    }
}

async function addProduct(productData, imageFile = null) {
    try {
        let imageUrl = productData.image_url;
        
        // Upload image if provided
        if (imageFile) {
            imageUrl = await uploadImageToSupabase(imageFile);
        }
        
        const newProduct = {
            name: productData.name,
            category: productData.category,
            price: productData.price,
            stock: productData.stock,
            description: productData.description,
            image_url: imageUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabaseClient
            .from('products')
            .insert([newProduct])
            .select()
            .single();
        
        if (error) throw error;
        
        showToast('Product added successfully!', 'success');
        await loadProducts();
        
        addActivity('product', `Added product: ${productData.name}`);
        
        return data;
        
    } catch (error) {
        console.error('Error adding product to Supabase:', error);
        // Save locally as fallback
        const localProduct = {
            id: 'prod_' + Date.now(),
            ...productData,
            image: productData.image_url,
            created_at: new Date().toISOString()
        };
        
        allProducts.push(localProduct);
        localStorage.setItem('salon_products', JSON.stringify(allProducts));
        
        showToast('Product saved locally (offline)', 'info');
        renderProductsTable();
        updateDashboardStats();
        
        // Return success for local save (don't throw error)
        return localProduct;
    }
}
async function updateProduct(productId, productData, imageFile = null) {
    try {
        let updates = {
            name: productData.name,
            category: productData.category,
            price: productData.price,
            stock: productData.stock,
            description: productData.description,
            updated_at: new Date().toISOString()
        };
        
        // Upload new image if provided
        if (imageFile) {
            updates.image_url = await uploadImageToSupabase(imageFile);
        } else if (productData.image_url) {
            updates.image_url = productData.image_url;
        }
        
        const { error } = await supabaseClient
            .from('products')
            .update(updates)
            .eq('id', productId);
        
        if (error) throw error;
        
        showToast('Product updated successfully!', 'success');
        await loadProducts();
        
        addActivity('product', `Updated product: ${productData.name}`);
        
    } catch (error) {
        console.error('Error updating product in Supabase:', error);
        // Update locally
        const index = allProducts.findIndex(p => p.id === productId);
        if (index !== -1) {
            allProducts[index] = { ...allProducts[index], ...productData };
            localStorage.setItem('salon_products', JSON.stringify(allProducts));
        }
        
        showToast('Product updated locally (offline)', 'info');
        renderProductsTable();
        
        // Return success for local update (don't throw error)
        return { success: true };
    }
}


async function deleteProduct(productId) {
    try {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', productId);
        
        if (error) throw error;
        
        showToast('Product deleted successfully', 'success');
        await loadProducts();
        
        const product = allProducts.find(p => p.id === productId);
        if (product) {
            addActivity('product', `Deleted product: ${product.name}`);
        }
        
    } catch (error) {
        console.error('Error deleting product:', error);
        // Delete locally
        allProducts = allProducts.filter(p => p.id !== productId);
        localStorage.setItem('salon_products', JSON.stringify(allProducts));
        
        showToast('Product deleted locally (offline)', 'info');
        renderProductsTable();
        updateDashboardStats();
    }
}

// ====== SERVICES MANAGEMENT ======
async function loadServices() {
    try {
        const { data: services, error } = await supabaseClient
            .from('services')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allServices = services || [];
        localStorage.setItem('salon_services', JSON.stringify(allServices));
        
        renderServicesTable();
        updateDashboardStats();
        
        return allServices;
    } catch (error) {
        console.error('Error loading services:', error);
        return loadServicesFromLocal();
    }
}

function loadServicesFromLocal() {
    const localServices = localStorage.getItem('salon_services');
    if (localServices) {
        allServices = JSON.parse(localServices);
    } else {
        allServices = [];
    }
    
    renderServicesTable();
    updateDashboardStats();
    return allServices;
}

function openServiceModal(service = null) {
    const modal = document.getElementById('service-modal');
    const title = document.getElementById('service-modal-title');
    const form = document.getElementById('service-form');
    
    if (!modal || !title || !form) {
        console.error('Service modal elements not found!');
        return;
    }
    
    if (service) {
        // Edit mode
        title.textContent = 'Edit Service';
        document.getElementById('service-id').value = service.id;
        document.getElementById('service-name').value = service.name || '';
        document.getElementById('service-category').value = service.category || 'hair';
        document.getElementById('service-price').value = service.price || '';
        document.getElementById('service-duration').value = service.duration || '45 min';
        document.getElementById('service-description').value = service.description || '';
        
        // Set icon
        document.querySelectorAll('.icon-option').forEach(option => {
            option.classList.remove('selected');
            if (option.getAttribute('data-icon') === service.icon) {
                option.classList.add('selected');
            }
        });
        document.getElementById('selected-icon-preview').textContent = service.icon || '💇';
        
        form.onsubmit = (e) => {
            e.preventDefault();
            handleServiceSubmit(e, service.id);
        };
    } else {
        // Add mode
        title.textContent = 'Add New Service';
        form.reset();
        document.querySelectorAll('.icon-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.getElementById('selected-icon-preview').textContent = '💇';
        
        form.onsubmit = (e) => {
            e.preventDefault();
            handleServiceSubmit(e);
        };
    }
    
    setupIconSelection();
    modal.classList.add('active');
}

async function handleServiceSubmit(e, serviceId = null) {
    e.preventDefault();
    
    const selectedIcon = document.querySelector('.icon-option.selected');
    
    const formData = {
        name: document.getElementById('service-name').value,
        category: document.getElementById('service-category').value,
        price: parseFloat(document.getElementById('service-price').value),
        duration: document.getElementById('service-duration').value,
        description: document.getElementById('service-description').value,
        icon: selectedIcon ? selectedIcon.getAttribute('data-icon') : '💇'
    };
    
    if (!formData.name || !formData.category || !formData.price) {
        showToast('Please fill required fields', 'error');
        return;
    }
    
    try {
        if (serviceId) {
            await updateService(serviceId, formData);
        } else {
            await addService(formData);
        }
        
        closeModal('service-modal');
        
    } catch (error) {
        console.error('Service submit error:', error);
        showToast('Failed to save service: ' + error.message, 'error');
    }
}

async function addService(serviceData) {
    try {
        const newService = {
            name: serviceData.name,
            category: serviceData.category,
            price: serviceData.price,
            duration: serviceData.duration,
            description: serviceData.description,
            icon: serviceData.icon,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabaseClient
            .from('services')
            .insert([newService])
            .select()
            .single();
        
        if (error) throw error;
        
        showToast('Service added successfully!', 'success');
        await loadServices();
        
        addActivity('service', `Added service: ${serviceData.name}`);
        
        return data;
        
    } catch (error) {
        console.error('Error adding service:', error);
        // Save locally
        const localService = {
            id: 'serv_' + Date.now(),
            ...serviceData,
            created_at: new Date().toISOString()
        };
        
        allServices.push(localService);
        localStorage.setItem('salon_services', JSON.stringify(allServices));
        
        showToast('Service saved locally (offline)', 'info');
        renderServicesTable();
        updateDashboardStats();
        throw error;
    }
}

async function updateService(serviceId, serviceData) {
    try {
        const updates = {
            name: serviceData.name,
            category: serviceData.category,
            price: serviceData.price,
            duration: serviceData.duration,
            description: serviceData.description,
            icon: serviceData.icon,
            updated_at: new Date().toISOString()
        };
        
        const { error } = await supabaseClient
            .from('services')
            .update(updates)
            .eq('id', serviceId);
        
        if (error) throw error;
        
        showToast('Service updated successfully!', 'success');
        await loadServices();
        
        addActivity('service', `Updated service: ${serviceData.name}`);
        
    } catch (error) {
        console.error('Error updating service:', error);
        // Update locally
        const index = allServices.findIndex(s => s.id === serviceId);
        if (index !== -1) {
            allServices[index] = { ...allServices[index], ...serviceData };
            localStorage.setItem('salon_services', JSON.stringify(allServices));
        }
        
        showToast('Service updated locally (offline)', 'info');
        renderServicesTable();
        throw error;
    }
}

async function deleteService(serviceId) {
    try {
        const { error } = await supabaseClient
            .from('services')
            .delete()
            .eq('id', serviceId);
        
        if (error) throw error;
        
        showToast('Service deleted successfully', 'success');
        await loadServices();
        
        const service = allServices.find(s => s.id === serviceId);
        if (service) {
            addActivity('service', `Deleted service: ${service.name}`);
        }
        
    } catch (error) {
        console.error('Error deleting service:', error);
        // Delete locally
        allServices = allServices.filter(s => s.id !== serviceId);
        localStorage.setItem('salon_services', JSON.stringify(allServices));
        
        showToast('Service deleted locally (offline)', 'info');
        renderServicesTable();
        updateDashboardStats();
    }
}

// ====== BOOKINGS MANAGEMENT ======
async function loadBookings() {
    try {
        const { data: bookings, error } = await supabaseClient
            .from('bookings')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        allBookings = bookings || [];
        localStorage.setItem('salon_bookings', JSON.stringify(allBookings));
        
        renderBookingsTable();
        return allBookings;
    } catch (error) {
        console.error('Error loading bookings:', error);
        const localBookings = localStorage.getItem('salon_bookings');
        allBookings = localBookings ? JSON.parse(localBookings) : [];
        renderBookingsTable();
        return allBookings;
    }
}

// ====== ORDERS MANAGEMENT ======
async function loadOrders() {
    try {
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        allOrders = orders || [];
        localStorage.setItem('salon_orders', JSON.stringify(allOrders));
        
        renderOrdersTable();
        return allOrders;
    } catch (error) {
        console.error('Error loading orders:', error);
        const localOrders = localStorage.getItem('salon_orders');
        allOrders = localOrders ? JSON.parse(localOrders) : [];
        renderOrdersTable();
        return allOrders;
    }
}

// ====== IMAGE UPLOAD ======
async function uploadImageToSupabase(file) {
    if (!file || !file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
    }
    
    if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image must be less than 2MB');
    }
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = fileName;
        
        // Upload to Supabase Storage
        const { data, error } = await supabaseClient.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);
        
        return publicUrl;
        
    } catch (error) {
        console.error('Image upload error:', error);
        // Fallback to data URL
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                resolve(e.target.result);
            };
            reader.readAsDataURL(file);
        });
    }
}

// ====== UI RENDERING FUNCTIONS ======
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
                ${product.image_url ? 
                    `<img src="${product.image_url}" alt="${product.name}" class="table-image">` :
                    `<div class="table-icon"><i class="fas fa-image"></i></div>`
                }
            </td>
            <td>
                <strong>${product.name}</strong>
                <div class="text-muted small">${product.description?.substring(0, 50) || ''}...</div>
            </td>
            <td><span class="category-badge">${product.category}</span></td>
            <td><strong class="price">Ksh ${product.price?.toLocaleString() || '0'}</strong></td>
            <td><span class="stock ${product.stock < 5 ? 'low-stock' : ''}">${product.stock || 0} items</span></td>
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
                    <button class="table-btn delete" onclick="deleteProductPrompt('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

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
            <td><div class="table-icon large">${service.icon || '💅'}</div></td>
            <td>
                <strong>${service.name}</strong>
                <div class="text-muted small">${service.description?.substring(0, 50) || ''}...</div>
            </td>
            <td><span class="category-badge">${service.category}</span></td>
            <td><strong class="price">Ksh ${service.price?.toLocaleString() || '0'}</strong></td>
            <td>${service.duration || '45 min'}</td>
            <td><span class="status-badge status-active">Active</span></td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editService('${service.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-btn delete" onclick="deleteServicePrompt('${service.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

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
            <td><span class="booking-id">#${booking.id?.substring(0, 8) || 'N/A'}</span></td>
            <td><strong>${booking.customer_name || 'N/A'}</strong></td>
            <td>${booking.service_name || 'N/A'}</td>
            <td>
                <div>${formatDate(booking.date)}</div>
                <div class="text-muted small">${booking.time || ''}</div>
            </td>
            <td>
                <div>${booking.customer_phone || 'N/A'}</div>
                ${booking.customer_email ? `<div class="text-muted small">${booking.customer_email}</div>` : ''}
            </td>
            <td><strong>Ksh ${(booking.service_price || 0).toLocaleString()}</strong></td>
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
                    <button class="table-btn delete" onclick="deleteBookingPrompt('${booking.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

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
            <td><span class="order-id">#${order.id?.substring(0, 8) || 'N/A'}</span></td>
            <td>${order.customer_name || 'N/A'}</td>
            <td>
                <div>${order.items?.length || 0} items</div>
                <div class="text-muted small">${order.items?.[0]?.name || ''}</div>
            </td>
            <td><strong>Ksh ${(order.total || 0).toLocaleString()}</strong></td>
            <td><span class="method-badge">${order.method || 'whatsapp'}</span></td>
            <td>${formatDate(order.created_at)}</td>
            <td><span class="status-badge status-completed">Completed</span></td>
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

// ====== SETUP EVENT LISTENERS ======
function setupEventListeners() {
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Toggle password visibility
    const togglePasswordBtn = document.getElementById('toggle-password');
    if (togglePasswordBtn && adminPasswordInput) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = adminPasswordInput.type === 'password' ? 'text' : 'password';
            adminPasswordInput.type = type;
            this.innerHTML = type === 'password' ? 
                '<i class="fas fa-eye"></i>' : 
                '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Mobile menu
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchSection(section);
            
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    // FIXED: Add Product Button
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            console.log('Add product button clicked');
            openProductModal();
        });
    }
    
    // Add Service Button
    const addServiceBtn = document.getElementById('add-service-btn');
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', () => {
            openServiceModal();
        });
    }
    
    // Quick action buttons
    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            handleQuickAction(action);
        });
    });
    
    // Password change form
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
    
    // Modal close buttons
    document.querySelectorAll('.close-modal, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) closeAllModals();
        });
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeAllModals();
    });
}

function setupImageUpload() {
    const uploadArea = document.getElementById('image-upload-area');
    const fileInput = document.getElementById('image-upload');
    const urlInput = document.getElementById('image-url');
    const urlPreview = document.getElementById('url-preview');
    
    if (uploadArea && fileInput) {
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
            if (file) handleImageFile(file);
        });
    }
    
    function handleImageFile(file) {
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image must be less than 2MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            if (urlPreview) {
                urlPreview.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image" style="max-width:200px;border-radius:8px;">`;
            }
            if (urlInput) {
                urlInput.value = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
}

function setupIconSelection() {
    const iconsGrid = document.getElementById('icons-grid');
    const selectedIconPreview = document.getElementById('selected-icon-preview');
    
    if (iconsGrid) {
        iconsGrid.addEventListener('click', (e) => {
            const iconOption = e.target.closest('.icon-option');
            if (iconOption) {
                document.querySelectorAll('.icon-option').forEach(option => {
                    option.classList.remove('selected');
                });
                
                iconOption.classList.add('selected');
                selectedIconPreview.textContent = iconOption.getAttribute('data-icon');
            }
        });
    }
}

// ====== PASSWORD CHANGE ======
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    try {
        // Get current admin data
        const { data: adminData, error: fetchError } = await supabaseClient
            .from('admin_settings')
            .select('*')
            .limit(1)
            .single();
        
        let isValid = false;
        
        if (fetchError || !adminData) {
            // Check local storage
            const storedHash = localStorage.getItem('admin_password_hash');
            isValid = checkPassword(currentPassword, storedHash) || 
                     currentPassword === DEFAULT_ADMIN_PASSWORD;
        } else {
            isValid = checkPassword(currentPassword, adminData.password_hash);
        }
        
        if (!isValid) {
            showToast('Current password is incorrect', 'error');
            return;
        }
        
        // Update password
        const newHash = hashPassword(newPassword);
        
        // Try to update in Supabase
        try {
            const { error: updateError } = await supabaseClient
                .from('admin_settings')
                .update({
                    password_hash: newHash,
                    updated_at: new Date().toISOString()
                })
                .eq('id', adminData?.id || 'admin_001');
            
            if (updateError) throw updateError;
        } catch (error) {
            console.log('Updating password locally only');
        }
        
        // Always update local storage
        localStorage.setItem('admin_password_hash', newHash);
        
        showToast('Password changed successfully! Please login again.', 'success');
        e.target.reset();
        
        // Logout after 2 seconds
        setTimeout(() => {
            handleLogout();
        }, 2000);
        
        addActivity('security', 'Changed admin password');
        
    } catch (error) {
        console.error('Password change error:', error);
        showToast('Failed to change password', 'error');
    }
}

// ====== UTILITY FUNCTIONS ======
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 300);
    }, 5000);
}

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

function checkPassword(password, hash) {
    return hashPassword(password) === hash;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
}

function addActivity(type, message) {
    const activities = JSON.parse(localStorage.getItem('salon_activities') || '[]');
    activities.push({
        type,
        message,
        timestamp: new Date().toISOString()
    });
    
    if (activities.length > 50) activities.shift();
    localStorage.setItem('salon_activities', JSON.stringify(activities));
    
    if (currentSection === 'dashboard') {
        loadRecentActivity();
    }
}

function loadRecentActivity() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    const activities = JSON.parse(localStorage.getItem('salon_activities') || '[]');
    const recentActivities = activities.slice(-5).reverse();
    
    if (recentActivities.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <i class="fas fa-info-circle"></i>
                <div class="activity-content">
                    <p>No recent activity</p>
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
                <small>${formatDate(activity.timestamp)}</small>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    switch(type) {
        case 'product': return 'shopping-bag';
        case 'service': return 'spa';
        case 'booking': return 'calendar-check';
        case 'security': return 'shield-alt';
        default: return 'info-circle';
    }
}

function switchSection(section) {
    // Update active nav
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === section) {
            item.classList.add('active');
        }
    });
    
    // Show active content
    contentSections.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${section}-content`) {
            content.classList.add('active');
        }
    });
    
    currentSection = section;
    
    // Load section data
    switch(section) {
        case 'products': loadProducts(); break;
        case 'services': loadServices(); break;
        case 'bookings': loadBookings(); break;
        case 'orders': loadOrders(); break;
        case 'dashboard': loadDashboardData(); break;
    }
}

function handleQuickAction(action) {
    switch(action) {
        case 'add-product': openProductModal(); break;
        case 'add-service': openServiceModal(); break;
        case 'view-bookings': switchSection('bookings'); break;
        case 'export-data': switchSection('export'); break;
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

function loadLocalData() {
    // Load from localStorage
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

// ====== GLOBAL FUNCTIONS ======
window.editProduct = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) openProductModal(product);
};

window.deleteProductPrompt = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product && confirm(`Delete "${product.name}"? This cannot be undone.`)) {
        deleteProduct(productId);
    }
};

window.editService = function(serviceId) {
    const service = allServices.find(s => s.id === serviceId);
    if (service) openServiceModal(service);
};

window.deleteServicePrompt = function(serviceId) {
    const service = allServices.find(s => s.id === serviceId);
    if (service && confirm(`Delete "${service.name}"? This cannot be undone.`)) {
        deleteService(serviceId);
    }
};

window.openProductModal = openProductModal;
window.openServiceModal = openServiceModal;

console.log('✅ Admin Supabase JS loaded successfully');