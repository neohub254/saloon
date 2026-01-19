/*
=============================================
ADMIN DASHBOARD JAVASCRIPT - FULL CRUD FOR PRODUCTS
NOW WITH RENDER BACKEND SUPPORT
=============================================
*/

// Admin Products Database - Loaded from Render backend
let adminProducts = [];

// Load products from Render backend
async function loadProductsFromBackend() {
    try {
        const response = await fetch('https://beautysalon-div4.onrender.com/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        adminProducts = await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
        adminProducts = [];
        showNotification('Failed to load products. Please refresh the page.', 'error');
    }
}

// Initialize Admin Dashboard
document.addEventListener('DOMContentLoaded', async function() {
    // Load products from backend first
    await loadProductsFromBackend();
    
    // Then initialize everything else
    initAdminDashboard();
    loadDashboardData();
    loadProductsTable();
    initCharts();
    initEventListeners();
});

function initAdminDashboard() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    // Navigation switching
    const navLinks = document.querySelectorAll('.sidebar-nav a[data-section]');
    const sections = document.querySelectorAll('.admin-section');
    const pageTitle = document.getElementById('page-title');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active to clicked link
            this.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => section.classList.remove('active'));
            
            // Show selected section
            const sectionId = this.dataset.section;
            const targetSection = document.getElementById(`${sectionId}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
                
                // Update page title
                if (pageTitle) {
                    pageTitle.textContent = this.textContent.trim();
                }
            }
        });
    });
    
    // Modal functionality
    const productModal = document.getElementById('product-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-product');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            productModal.classList.remove('active');
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            productModal.classList.remove('active');
            resetProductForm();
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.classList.remove('active');
            resetProductForm();
        }
    });
}

function loadDashboardData() {
    // Update stats
    updateDashboardStats();
    
    // Load recent bookings
    loadRecentBookings();
    
    // Load low stock products
    loadLowStockProducts();
}

function updateDashboardStats() {
    const totalProducts = adminProducts.length;
    const todayAppointments = 8; // Mock data
    const monthlyRevenue = 245800; // Mock data
    const totalCustomers = 156; // Mock data
    
    document.getElementById('total-products').textContent = totalProducts;
    document.getElementById('today-appointments').textContent = todayAppointments;
    document.getElementById('monthly-revenue').textContent = `KSH ${monthlyRevenue.toLocaleString()}`;
    document.getElementById('total-customers').textContent = totalCustomers;
}

function loadRecentBookings() {
    const bookingsContainer = document.getElementById('recent-bookings');
    if (!bookingsContainer) return;
    
    // Mock bookings data
    const recentBookings = [
        { customer: "Mary Wanjiku", service: "Hair Coloring", date: "2023-12-10", time: "10:00 AM", status: "Confirmed" },
        { customer: "Sarah K.", service: "Facial", date: "2023-12-10", time: "2:00 PM", status: "Pending" },
        { customer: "Grace M.", service: "Bridal Makeup", date: "2023-12-11", time: "9:00 AM", status: "Confirmed" },
        { customer: "Jane Doe", service: "Manicure", date: "2023-12-11", time: "4:00 PM", status: "Completed" },
        { customer: "John Smith", service: "Haircut", date: "2023-12-12", time: "11:00 AM", status: "Confirmed" }
    ];
    
    bookingsContainer.innerHTML = '';
    
    recentBookings.forEach(booking => {
        const statusClass = getStatusClass(booking.status);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${booking.customer}</td>
            <td>${booking.service}</td>
            <td>${booking.date}</td>
            <td>${booking.time}</td>
            <td><span class="status-badge ${statusClass}">${booking.status}</span></td>
        `;
        bookingsContainer.appendChild(row);
    });
}

function loadLowStockProducts() {
    const lowStockContainer = document.getElementById('low-stock-products');
    if (!lowStockContainer) return;
    
    const lowStockProducts = adminProducts.filter(product => product.stock <= 10);
    
    lowStockContainer.innerHTML = '';
    
    if (lowStockProducts.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="4" style="text-align: center; color: var(--text-gray);">
                No low stock products
            </td>
        `;
        lowStockContainer.appendChild(row);
        return;
    }
    
    lowStockProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.stock}</td>
            <td>
                <button class="btn-edit" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        lowStockContainer.appendChild(row);
    });
}

function loadProductsTable(filter = 'all', search = '') {
    const tableBody = document.getElementById('products-table-body');
    if (!tableBody) return;
    
    let filteredProducts = [...adminProducts];
    
    // Apply category filter
    if (filter !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === filter);
    }
    
    // Apply search filter
    if (search) {
        const searchTerm = search.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply stock filter
    const stockFilter = document.getElementById('stock-filter')?.value || 'all';
    if (stockFilter !== 'all') {
        switch(stockFilter) {
            case 'in-stock':
                filteredProducts = filteredProducts.filter(p => p.stock > 10);
                break;
            case 'low-stock':
                filteredProducts = filteredProducts.filter(p => p.stock <= 10 && p.stock > 0);
                break;
            case 'out-of-stock':
                filteredProducts = filteredProducts.filter(p => p.stock === 0);
                break;
        }
    }
    
    tableBody.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" style="text-align: center; color: var(--text-gray); padding: 40px;">
                No products found. Add your first product!
            </td>
        `;
        tableBody.appendChild(row);
        return;
    }
    
    filteredProducts.forEach(product => {
        const statusClass = getStockStatusClass(product.stock);
        const statusText = getStockStatusText(product.stock);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="product-image-cell">
                <div class="product-image-preview" style="background-image: url('${product.image}')"></div>
            </td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>KSH ${product.price.toLocaleString()}</td>
            <td>${product.stock}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function getStockStatusClass(stock) {
    if (stock > 10) return 'status-in-stock';
    if (stock > 0 && stock <= 10) return 'status-low-stock';
    return 'status-out-of-stock';
}

function getStockStatusText(stock) {
    if (stock > 10) return 'In Stock';
    if (stock > 0 && stock <= 10) return 'Low Stock';
    return 'Out of Stock';
}

function getStatusClass(status) {
    switch(status.toLowerCase()) {
        case 'confirmed':
        case 'completed':
            return 'status-in-stock';
        case 'pending':
            return 'status-low-stock';
        case 'cancelled':
            return 'status-out-of-stock';
        default:
            return '';
    }
}

function initEventListeners() {
    // Add Product Button
    const addProductBtn = document.getElementById('add-product-btn');
    const quickAddBtn = document.getElementById('quick-add');
    const productForm = document.getElementById('product-form');
    
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            openProductModal('add');
        });
    }
    
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', () => {
            openProductModal('add');
        });
    }
    
    // Product Form Submit
    if (productForm) {
        productForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveProduct();
        });
    }
    
    // Search functionality
    const productSearch = document.getElementById('product-search');
    if (productSearch) {
        productSearch.addEventListener('input', function() {
            const filter = document.getElementById('category-filter')?.value || 'all';
            loadProductsTable(filter, this.value);
        });
    }
    
    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const search = document.getElementById('product-search')?.value || '';
            loadProductsTable(this.value, search);
        });
    }
    
    // Stock filter
    const stockFilter = document.getElementById('stock-filter');
    if (stockFilter) {
        stockFilter.addEventListener('change', function() {
            const filter = document.getElementById('category-filter')?.value || 'all';
            const search = document.getElementById('product-search')?.value || '';
            loadProductsTable(filter, search);
        });
    }
}

function openProductModal(mode, productId = null) {
    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('modal-title');
    const productForm = document.getElementById('product-form');
    
    if (mode === 'add') {
        modalTitle.textContent = 'Add New Product';
        productForm.reset();
        document.getElementById('product-id').value = '';
    } else if (mode === 'edit' && productId) {
        modalTitle.textContent = 'Edit Product';
        const product = adminProducts.find(p => p.id === productId);
        if (product) {
            fillProductForm(product);
        }
    }
    
    modal.classList.add('active');
}

function fillProductForm(product) {
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-price').value = product.price;
    document.getElementById('original-price').value = product.originalPrice || '';
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-image').value = product.image || '';
    document.getElementById('product-description').value = product.description;
    document.getElementById('product-rating').value = product.rating || '';
    document.getElementById('product-badge').value = product.badge || '';
}

function resetProductForm() {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
}

// ========== CHANGED: SAVE PRODUCT TO RENDER BACKEND ==========
async function saveProduct() {
    const productId = document.getElementById('product-id').value;
    const productData = {
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        price: parseInt(document.getElementById('product-price').value),
        originalPrice: parseInt(document.getElementById('original-price').value) || null,
        stock: parseInt(document.getElementById('product-stock').value),
        image: document.getElementById('product-image').value || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
        description: document.getElementById('product-description').value,
        rating: parseFloat(document.getElementById('product-rating').value) || 0,
        badge: document.getElementById('product-badge').value || null,
        reviews: 0,
        createdAt: new Date().toISOString().split('T')[0]
    };
    
    try {
        if (productId) {
            // Edit existing product
            const response = await fetch(`https://beautysalon-div4.onrender.com/api/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            
            if (!response.ok) throw new Error('Failed to update product');
            showNotification('Product updated successfully!');
        } else {
            // Add new product
            const response = await fetch('https://beautysalon-div4.onrender.com/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            
            if (!response.ok) throw new Error('Failed to add product');
            showNotification('Product added successfully!');
        }
        
        // Reload products from backend
        await loadProductsFromBackend();
        
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('Failed to save product. Please try again.', 'error');
        return;
    }
    
    // Update dashboard
    updateDashboardStats();
    loadProductsTable();
    loadLowStockProducts();
    
    // Close modal and reset form
    document.getElementById('product-modal').classList.remove('active');
    resetProductForm();
    
    // Update frontend products page if open
    updateFrontendProducts();
}

function editProduct(productId) {
    openProductModal('edit', productId);
}

// ========== CHANGED: DELETE PRODUCT FROM RENDER BACKEND ==========
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`https://beautysalon-div4.onrender.com/api/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete product');
        
        // Reload products from backend
        await loadProductsFromBackend();
        
        // Update UI
        updateDashboardStats();
        loadProductsTable();
        loadLowStockProducts();
        showNotification('Product deleted successfully!');
        
        // Update frontend products page if open
        updateFrontendProducts();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Failed to delete product. Please try again.', 'error');
    }
}

function updateFrontendProducts() {
    console.log('Products updated. Frontend would be notified in a real application.');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'admin-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        background: var(--gradient-pink);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 10000;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function initCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Revenue (KSH)',
                    data: [150000, 180000, 210000, 195000, 230000, 245800, 260000],
                    borderColor: '#ff4d8d',
                    backgroundColor: 'rgba(255, 77, 141, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#b8b8c5',
                            callback: function(value) {
                                return 'KSH ' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#b8b8c5'
                        }
                    }
                }
            }
        });
    }
    
    // Services Chart
    const servicesCtx = document.getElementById('servicesChart');
    if (servicesCtx) {
        new Chart(servicesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Hair Services', 'Skincare', 'Makeup', 'Nail Care', 'Spa'],
                datasets: [{
                    data: [35, 25, 20, 12, 8],
                    backgroundColor: [
                        '#ff4d8d',
                        '#ff85b3',
                        '#ffd6e7',
                        '#e6397a',
                        '#ff66a3'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#fff',
                            padding: 20
                        }
                    }
                }
            }
        });
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);