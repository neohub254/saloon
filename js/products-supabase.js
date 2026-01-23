// products-supabase.js - Main functionality for products-services page
// DIRECT Supabase Connection

// ====== GLOBAL VARIABLES ======
let currentView = 'products';
let currentCategory = 'all';
let allProducts = [];
let allServices = [];
let basketItems = [];
let isLoading = false;

// ====== DOM ELEMENTS ======
const contentGrid = document.getElementById('content-grid');
const viewToggleBtns = document.querySelectorAll('.toggle-btn');
const categoryBtns = document.querySelectorAll('.category-btn');
const searchInput = document.getElementById('search-input');
const basketCount = document.getElementById('basket-count');
const basketItemsContainer = document.getElementById('basket-items');
const basketTotal = document.getElementById('basket-total');
const orderTotal = document.getElementById('order-total');
const orderSummary = document.getElementById('order-summary');

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Products page initializing with Supabase...');
    
    initializePage();
    setupEventListeners();
    setupMobileBasket();
    await loadInitialData();
    loadBasketFromLocalStorage();
});

// ====== DATA LOADING ======
async function loadInitialData() {
    try {
        showLoading(true);
        
        // Load products from Supabase
        const { data: products, error: productsError } = await supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (productsError) throw productsError;
        allProducts = products || [];
        
        // Load services from Supabase
        const { data: services, error: servicesError } = await supabaseClient
            .from('services')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (servicesError) throw servicesError;
        allServices = services || [];
        
        // Save to localStorage as backup
        localStorage.setItem('salon_products', JSON.stringify(allProducts));
        localStorage.setItem('salon_services', JSON.stringify(allServices));
        
        console.log(`✅ Loaded ${allProducts.length} products, ${allServices.length} services`);
        renderItems();
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load from server. Using offline data.', 'warning');
        loadFallbackData();
        showLoading(false);
    }
}

function loadFallbackData() {
    // Load from localStorage
    const savedProducts = localStorage.getItem('salon_products');
    const savedServices = localStorage.getItem('salon_services');
    
    if (savedProducts) allProducts = JSON.parse(savedProducts);
    if (savedServices) allServices = JSON.parse(savedServices);
    
    if (allProducts.length === 0 && allServices.length === 0) {
        // Load default data
        allProducts = [
            {
                id: 'prod_1',
                name: 'Designer Synthetic Wig',
                price: 3500,
                category: 'wigs',
                stock: 8,
                description: 'Premium quality synthetic wig',
                image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop'
            }
        ];
        allServices = [
            {
                id: 'serv_1',
                name: 'Hair Styling & Treatment',
                price: 1500,
                category: 'hair',
                duration: '60 min',
                description: 'Professional hair styling',
                icon: '💇'
            }
        ];
    }
    
    renderItems();
}

// ====== BASKET FUNCTIONS (Mobile Optimized) ======
function loadBasketFromLocalStorage() {
    const savedBasket = localStorage.getItem('salon_basket');
    if (savedBasket) {
        basketItems = JSON.parse(savedBasket);
        updateBasketDisplay();
    }
}

function saveBasketToLocalStorage() {
    localStorage.setItem('salon_basket', JSON.stringify(basketItems));
}

async function addItemToBasket(item, type = 'product') {
    // Check if item already in basket
    const existingItem = basketItems.find(bi => 
        bi.id === item.id && bi.type === type);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        basketItems.push({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            type: type,
            quantity: 1,
            image_url: item.image_url || item.image,
            icon: item.icon,
            category: item.category
        });
    }
    
    updateBasketDisplay();
    saveBasketToLocalStorage();
    
    // Show success feedback (haptic on mobile)
    if ('vibrate' in navigator) {
        navigator.vibrate(50); // Haptic feedback for mobile
    }
    
    showToast(`${item.name} added to basket!`, 'success');
    
    // Auto-open basket on mobile
    if (window.innerWidth <= 768 && basketItems.length === 1) {
        openBasket();
    }
}

function updateBasketItemQuantity(itemId, newQuantity) {
    const item = basketItems.find(bi => bi.id === itemId);
    if (item) {
        item.quantity = newQuantity;
        if (item.quantity <= 0) {
            basketItems = basketItems.filter(bi => bi.id !== itemId);
        }
        updateBasketDisplay();
        saveBasketToLocalStorage();
    }
}

function removeBasketItem(itemId) {
    basketItems = basketItems.filter(bi => bi.id !== itemId);
    updateBasketDisplay();
    saveBasketToLocalStorage();
    showToast('Item removed from basket', 'success');
}

function clearBasket() {
    if (basketItems.length === 0) return;
    
    if (confirm('Clear all items from basket?')) {
        basketItems = [];
        updateBasketDisplay();
        saveBasketToLocalStorage();
        showToast('Basket cleared', 'success');
    }
}

// ====== MOBILE BASKET OPTIMIZATION ======
function setupMobileBasket() {
    const basketSidebar = document.getElementById('basket-sidebar');
    if (!basketSidebar) return;
    
    // Make basket swipeable on mobile
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;
    
    basketSidebar.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isSwiping = true;
    }, { passive: true });
    
    basketSidebar.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        currentX = e.touches[0].clientX;
        const diff = startX - currentX;
        
        // Swipe right to close
        if (diff < -50) {
            basketSidebar.classList.remove('active');
            isSwiping = false;
        }
    }, { passive: true });
    
    basketSidebar.addEventListener('touchend', () => {
        isSwiping = false;
    });
    
    // Increase button sizes for mobile
    if (window.innerWidth <= 768) {
        const buttons = basketSidebar.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.style.padding = '12px 16px';
            btn.style.fontSize = '16px';
            btn.style.minHeight = '48px';
        });
        
        // Make quantity buttons larger
        const qtyBtns = basketSidebar.querySelectorAll('.qty-btn');
        qtyBtns.forEach(btn => {
            btn.style.width = '40px';
            btn.style.height = '40px';
            btn.style.fontSize = '20px';
        });
    }
}

function openBasket() {
    const basketSidebar = document.getElementById('basket-sidebar');
    if (basketSidebar) {
        basketSidebar.classList.add('active');
    }
}

function closeBasket() {
    const basketSidebar = document.getElementById('basket-sidebar');
    if (basketSidebar) {
        basketSidebar.classList.remove('active');
    }
}

// ====== UI FUNCTIONS ======
function initializePage() {
    const savedView = localStorage.getItem('salonView') || 'products';
    switchView(savedView);
    
    const savedCategory = localStorage.getItem('salonCategory') || 'all';
    setActiveCategory(savedCategory);
}

function setupEventListeners() {
    // View toggle buttons
    viewToggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            switchView(view);
        });
    });
    
    // Category filter buttons
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            setActiveCategory(category);
            filterItems();
        });
    });
    
    // Search input with debounce
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterItems, 300));
    }
    
    // Basket toggle
    const basketToggle = document.getElementById('basket-toggle');
    if (basketToggle) {
        basketToggle.addEventListener('click', openBasket);
        
        // Make basket toggle larger on mobile
        if (window.innerWidth <= 768) {
            basketToggle.style.padding = '12px';
            basketToggle.style.fontSize = '20px';
        }
    }
    
    // Close basket button
    const closeBasketBtn = document.getElementById('close-basket');
    if (closeBasketBtn) {
        closeBasketBtn.addEventListener('click', closeBasket);
    }
    
    // Clear basket button
    const clearBasketBtn = document.getElementById('clear-basket');
    if (clearBasketBtn) {
        clearBasketBtn.addEventListener('click', clearBasket);
    }
    
    // Checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (basketItems.length === 0) {
                showToast('Your basket is empty!', 'error');
                return;
            }
            updateOrderModal();
            openModal('order-modal');
        });
    }
    
    // Order method buttons
    const whatsappBtn = document.getElementById('whatsapp-order');
    const smsBtn = document.getElementById('sms-order');
    const callBtn = document.getElementById('call-order');
    
    if (whatsappBtn) whatsappBtn.addEventListener('click', placeOrderViaWhatsApp);
    if (smsBtn) smsBtn.addEventListener('click', placeOrderViaSMS);
    if (callBtn) callBtn.addEventListener('click', placeOrderViaCall);
    
    // Close modal button
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => closeModal('order-modal'));
    }
    
    // Item click delegation
    if (contentGrid) {
        contentGrid.addEventListener('click', handleItemClick);
    }
    
    // Basket item controls delegation
    if (basketItemsContainer) {
        basketItemsContainer.addEventListener('click', handleBasketItemClick);
    }
    
    // Close basket when clicking outside (mobile-friendly)
    document.addEventListener('click', function(e) {
        const basketSidebar = document.getElementById('basket-sidebar');
        const basketToggle = document.getElementById('basket-toggle');
        
        if (basketSidebar && basketSidebar.classList.contains('active')) {
            if (!basketSidebar.contains(e.target) && 
                !basketToggle.contains(e.target)) {
                closeBasket();
            }
        }
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeBasket();
            closeModal('order-modal');
            closeModal('quickview-modal');
        }
    });
}

function handleItemClick(e) {
    const quickviewBtn = e.target.closest('.quickview-btn');
    const addToBasketBtn = e.target.closest('.add-to-basket');
    const card = e.target.closest('.item-card');
    
    if (!card) return;
    
    const itemId = card.dataset.id;
    const itemType = card.dataset.type;
    
    if (quickviewBtn) {
        showQuickView(itemId, itemType);
    } else if (addToBasketBtn) {
        const item = itemType === 'product' 
            ? allProducts.find(p => p.id === itemId)
            : allServices.find(s => s.id === itemId);
        
        if (item) {
            addItemToBasket(item, itemType);
        }
    }
}

function handleBasketItemClick(e) {
    const basketItem = e.target.closest('.basket-item');
    if (!basketItem) return;
    
    const itemId = basketItem.dataset.id;
    
    if (e.target.closest('.remove-item')) {
        removeBasketItem(itemId);
    } else if (e.target.closest('.qty-decrease')) {
        const item = basketItems.find(bi => bi.id === itemId);
        if (item) {
            if (item.quantity > 1) {
                updateBasketItemQuantity(itemId, item.quantity - 1);
            } else {
                removeBasketItem(itemId);
            }
        }
    } else if (e.target.closest('.qty-increase')) {
        const item = basketItems.find(bi => bi.id === itemId);
        if (item) {
            updateBasketItemQuantity(itemId, item.quantity + 1);
        }
    }
}

function switchView(view) {
    currentView = view;
    localStorage.setItem('salonView', view);
    
    viewToggleBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });
    
    filterItems();
}

function setActiveCategory(category) {
    currentCategory = category;
    localStorage.setItem('salonCategory', category);
    
    categoryBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-category') === category);
    });
}

function filterItems() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    let itemsToShow = [];
    
    // Get items based on current view
    if (currentView === 'products') {
        itemsToShow = [...allProducts];
    } else {
        itemsToShow = [...allServices];
    }
    
    // Apply category filter
    if (currentCategory !== 'all') {
        itemsToShow = itemsToShow.filter(item => item.category === currentCategory);
    }
    
    // Apply search filter
    if (searchTerm) {
        itemsToShow = itemsToShow.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            (item.description && item.description.toLowerCase().includes(searchTerm))
        );
    }
    
    renderFilteredItems(itemsToShow);
}

function renderItems() {
    filterItems();
}

function renderFilteredItems(items) {
    if (!contentGrid) return;
    
    if (items.length === 0) {
        contentGrid.innerHTML = `
            <div class="no-items">
                <i class="fas fa-search"></i>
                <h3>No items found</h3>
                <p>Try changing your search or filter</p>
            </div>
        `;
        return;
    }
    
    contentGrid.innerHTML = items.map(item => {
        const isProduct = currentView === 'products';
        return createItemCard(item, isProduct);
    }).join('');
}

function createItemCard(item, isProduct) {
    const priceFormatted = formatCurrency(item.price);
    
    return `
        <div class="item-card fade-in" data-id="${item.id}" data-type="${isProduct ? 'product' : 'service'}">
            <div class="item-image">
                ${isProduct 
                    ? `<img src="${item.image_url || item.image || 'https://via.placeholder.com/400x300?text=No+Image'}" 
                          alt="${item.name}"
                          loading="lazy">`
                    : `<div class="item-icon">${item.icon || '💅'}</div>`
                }
                ${item.stock && item.stock < 5 ? `<div class="item-badge pulse">Only ${item.stock} left!</div>` : ''}
            </div>
            <div class="item-info">
                <div class="item-header">
                    <h3 class="item-title">${item.name}</h3>
                    <div class="item-price">${priceFormatted}</div>
                </div>
                <div class="item-category">
                    <i class="fas fa-tag"></i> ${item.category}
                </div>
                <p class="item-description">${item.description || 'Premium quality item'}</p>
                <div class="item-actions">
                    <button class="action-btn quickview-btn">
                        <i class="fas fa-eye"></i> Quick View
                    </button>
                    <button class="action-btn add-to-basket primary">
                        <i class="fas fa-shopping-basket"></i> Add to Basket
                    </button>
                </div>
            </div>
        </div>
    `;
}

function updateBasketDisplay() {
    // Update basket count
    const totalItems = basketItems.reduce((sum, item) => sum + item.quantity, 0);
    if (basketCount) {
        basketCount.textContent = totalItems;
        // Pulse animation for new items
        if (totalItems > 0) {
            basketCount.classList.add('pulse');
            setTimeout(() => basketCount.classList.remove('pulse'), 300);
        }
    }
    
    // Update basket items list
    if (!basketItemsContainer) return;
    
    if (basketItems.length === 0) {
        basketItemsContainer.innerHTML = `
            <div class="empty-basket">
                <i class="fas fa-shopping-basket"></i>
                <p>Your basket is empty</p>
                <p class="small-text">Add some beautiful items!</p>
            </div>
        `;
        if (basketTotal) basketTotal.textContent = 'Ksh 0';
        return;
    }
    
    // Calculate total and render items
    let total = 0;
    basketItemsContainer.innerHTML = '';
    
    basketItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'basket-item';
        itemElement.dataset.id = item.id;
        
        itemElement.innerHTML = `
            <div class="basket-item-image">
                ${item.type === 'product'
                    ? `<img src="${item.image_url || item.image || 'https://via.placeholder.com/100x100?text=Image'}" 
                          alt="${item.name}">`
                    : `<div class="basket-item-icon">${item.icon || '💅'}</div>`
                }
            </div>
            <div class="basket-item-details">
                <div class="basket-item-title">
                    <span>${item.name}</span>
                    <span class="basket-item-total">${formatCurrency(itemTotal)}</span>
                </div>
                <div class="basket-item-category">${item.category} • ${formatCurrency(item.price)} each</div>
                <div class="basket-item-controls">
                    <div class="quantity-controls">
                        <button class="qty-btn qty-decrease">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="qty-btn qty-increase">+</button>
                    </div>
                    <button class="remove-item" title="Remove item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        basketItemsContainer.appendChild(itemElement);
    });
    
    // Update total
    if (basketTotal) {
        basketTotal.textContent = formatCurrency(total);
    }
}

function updateOrderModal() {
    if (!orderSummary || !orderTotal) return;
    
    let total = 0;
    let summaryHTML = '';
    
    basketItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        summaryHTML += `
            <div class="order-item">
                <span>${item.name} × ${item.quantity}</span>
                <span>${formatCurrency(itemTotal)}</span>
            </div>
        `;
    });
    
    orderSummary.innerHTML = summaryHTML;
    orderTotal.textContent = formatCurrency(total);
}

// ====== ORDER PLACEMENT ======
function placeOrderViaWhatsApp() {
    const customerName = document.getElementById('customer-name')?.value || 'Customer';
    const customerPhone = document.getElementById('customer-phone')?.value || '0705455312';
    
    // Validate phone number
    if (!validatePhoneNumber(customerPhone)) {
        showToast('Please enter a valid phone number', 'error');
        return;
    }
    
    // Build WhatsApp message
    let message = `*NEW ORDER - Salon Elegance*\n\n`;
    message += `*Customer:* ${customerName}\n`;
    message += `*Phone:* ${customerPhone}\n\n`;
    message += `*Order Items:*\n`;
    
    let total = 0;
    basketItems.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        message += `${index + 1}. ${item.name} × ${item.quantity} = ${formatCurrency(itemTotal)}\n`;
    });
    
    message += `\n*Total Amount:* ${formatCurrency(total)}\n`;
    message += `\nPlease confirm availability and provide payment details.`;
    
    // Try to save order to Supabase
    saveOrderToSupabase(customerName, customerPhone, 'whatsapp', total);
    
    // Open WhatsApp
    const whatsappUrl = `https://wa.me/254705455312?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Close modal
    closeModal('order-modal');
}

function placeOrderViaSMS() {
    const customerName = document.getElementById('customer-name')?.value || 'Customer';
    const customerPhone = document.getElementById('customer-phone')?.value || '0705455312';
    
    if (!validatePhoneNumber(customerPhone)) {
        showToast('Please enter a valid phone number', 'error');
        return;
    }
    
    // Build SMS message
    let message = `ORDER: `;
    let total = 0;
    
    basketItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        message += `${item.name}(${item.quantity}) `;
    });
    
    message += `Total: ${formatCurrency(total)}. Name: ${customerName}`;
    
    // Save order
    saveOrderToSupabase(customerName, customerPhone, 'sms', total);
    
    // Open SMS app
    const smsUrl = `sms:0705455312?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
    
    closeModal('order-modal');
}

function placeOrderViaCall() {
    const customerName = document.getElementById('customer-name')?.value || 'Customer';
    
    // Save order
    saveOrderToSupabase(customerName, '', 'call', 0);
    
    // Initiate call
    window.location.href = 'tel:0705455312';
    closeModal('order-modal');
}

async function saveOrderToSupabase(customerName, customerPhone, method, total) {
    try {
        const { error } = await supabaseClient
            .from('orders')
            .insert([{
                items: basketItems,
                total: total,
                customer_name: customerName,
                customer_phone: customerPhone,
                method: method,
                status: 'pending',
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        // Clear basket after successful order
        basketItems = [];
        updateBasketDisplay();
        saveBasketToLocalStorage();
        
        showToast('Order submitted successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving order:', error);
        // Order will still be sent via WhatsApp/SMS/Call even if Supabase fails
    }
}

// ====== UTILITY FUNCTIONS ======
function showLoading(show) {
    isLoading = show;
    if (!contentGrid) return;
    
    if (show) {
        contentGrid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading items...</p>
            </div>
        `;
    }
}

function showToast(message, type = 'info') {
    // Use toast function from supabase-config
    if (window.showToast) {
        window.showToast(message, type);
    } else {
        alert(message);
    }
}

function formatCurrency(amount) {
    return `Ksh ${parseFloat(amount).toLocaleString()}`;
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

function validatePhoneNumber(phone) {
    // Simple Kenyan phone validation
    const phoneRegex = /^(?:254|\+254|0)?(7\d{8})$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
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

// ====== QUICK VIEW MODAL ======
function showQuickView(itemId, itemType) {
    const item = itemType === 'product' 
        ? allProducts.find(p => p.id === itemId)
        : allServices.find(s => s.id === itemId);
    
    if (!item) return;
    
    const modal = document.getElementById('quickview-modal');
    if (!modal) return;
    
    const priceFormatted = formatCurrency(item.price);
    
    modal.innerHTML = `
        <div class="modal-content quickview-content" style="max-width: 800px;">
            <div class="quickview-header">
                <button class="close-quickview"><i class="fas fa-times"></i></button>
            </div>
            <div class="quickview-body">
                <div class="quickview-image">
                    ${itemType === 'product'
                        ? `<img src="${item.image_url || item.image || 'https://via.placeholder.com/400x300?text=No+Image'}" 
                              alt="${item.name}">`
                        : `<div class="quickview-icon-large">${item.icon || '💅'}</div>`
                    }
                </div>
                <div class="quickview-details">
                    <h2>${item.name}</h2>
                    <div class="quickview-price">${priceFormatted}</div>
                    <div class="quickview-category"><i class="fas fa-tag"></i> ${item.category}</div>
                    <p class="quickview-description">${item.description || 'No description available'}</p>
                    
                    ${item.duration ? `<div class="quickview-duration"><i class="fas fa-clock"></i> ${item.duration}</div>` : ''}
                    ${item.stock ? `<div class="quickview-stock"><i class="fas fa-box"></i> ${item.stock} in stock</div>` : ''}
                    
                    <div class="quickview-actions">
                        <button class="add-to-basket-quickview" data-id="${item.id}" data-type="${itemType}">
                            <i class="fas fa-shopping-basket"></i> Add to Basket - ${priceFormatted}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    
    // Add event listeners
    modal.querySelector('.close-quickview').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.querySelector('.add-to-basket-quickview').addEventListener('click', () => {
        addItemToBasket(item, itemType);
        modal.classList.remove('active');
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// ====== GLOBAL FUNCTIONS ======
window.addItemToBasket = addItemToBasket;
window.removeBasketItem = removeBasketItem;
window.clearBasket = clearBasket;
window.openBasket = openBasket;
window.closeBasket = closeBasket;

// Initialize
console.log('✅ Products Supabase JS loaded successfully');