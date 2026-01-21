// products.js - Main functionality for products-services page
// Connects to Render backend: https://beautysalon-div4.onrender.com

// ====== CONFIGURATION ======
const API_BASE_URL = 'https://beautysalon-div4.onrender.com';
const API_ENDPOINTS = {
    products: '/api/products',
    services: '/api/services',
    basket: '/api/basket',
    orders: '/api/orders'
};

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
    console.log('Initializing products page...');
    console.log('Backend URL:', API_BASE_URL);
    
    initializePage();
    setupEventListeners();
    await loadInitialData();
    await loadBasketFromServer();
});

// ====== API FUNCTIONS ======

/**
 * Load products and services from backend
 */
async function loadInitialData() {
    try {
        showLoading(true);
        
        // Load products
        const productsResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.products}`);
        if (!productsResponse.ok) throw new Error('Failed to load products');
        allProducts = await productsResponse.json();
        
        // Load services
        const servicesResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.services}`);
        if (!servicesResponse.ok) throw new Error('Failed to load services');
        allServices = await servicesResponse.json();
        
        console.log('Loaded:', allProducts.length, 'products and', allServices.length, 'services');
        renderItems();
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load products and services. Please check if backend is running.');
        showLoading(false);
        
        // Fallback: Load from localStorage if backend fails
        loadFallbackData();
    }
}

/**
 * Load basket from server
 */
async function loadBasketFromServer() {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.basket}`);
        if (response.ok) {
            const data = await response.json();
            basketItems = data.items || [];
            updateBasketDisplay();
        }
    } catch (error) {
        console.log('Using local basket storage');
        loadBasketFromLocalStorage();
    }
}

/**
 * Add item to basket (server-side)
 */
async function addItemToBasket(item, type = 'product') {
    try {
        const basketItem = {
            id: item.id,
            name: item.name,
            price: item.price,
            type: type,
            quantity: 1,
            image: item.image,
            icon: item.icon,
            category: item.category
        };
        
        // Send to server
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.basket}/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(basketItem)
        });
        
        if (response.ok) {
            const result = await response.json();
            basketItems = result.items;
            updateBasketDisplay();
            showNotification(`${item.name} added to basket!`, 'success');
        } else {
            // Fallback to localStorage
            addToLocalBasket(basketItem);
        }
        
    } catch (error) {
        console.error('Error adding to basket:', error);
        // Fallback to localStorage
        addToLocalBasket({
            ...item,
            type: type,
            quantity: 1
        });
    }
}

/**
 * Update item quantity in basket
 */
async function updateBasketItemQuantity(itemId, newQuantity) {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.basket}/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ itemId, quantity: newQuantity })
        });
        
        if (response.ok) {
            const result = await response.json();
            basketItems = result.items;
            updateBasketDisplay();
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        // Fallback to localStorage update
        updateLocalBasketQuantity(itemId, newQuantity);
    }
}

/**
 * Remove item from basket
 */
async function removeBasketItem(itemId) {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.basket}/remove`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ itemId })
        });
        
        if (response.ok) {
            const result = await response.json();
            basketItems = result.items;
            updateBasketDisplay();
            showNotification('Item removed from basket', 'success');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        // Fallback to localStorage
        removeFromLocalBasket(itemId);
    }
}

/**
 * Clear entire basket
 */
async function clearBasket() {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.basket}/clear`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            basketItems = [];
            updateBasketDisplay();
            showNotification('Basket cleared', 'success');
        }
    } catch (error) {
        console.error('Error clearing basket:', error);
        // Fallback to localStorage
        clearLocalBasket();
    }
}

/**
 * Submit order to backend
 */
async function submitOrder(orderData) {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.orders}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('Order submitted successfully!', 'success');
            await clearBasket();
            return result;
        } else {
            throw new Error('Failed to submit order');
        }
    } catch (error) {
        console.error('Error submitting order:', error);
        showNotification('Failed to submit order. Please try again.', 'error');
        throw error;
    }
}

// ====== FALLBACK FUNCTIONS (when backend is unavailable) ======

function loadFallbackData() {
    // Try to load from localStorage as fallback
    const savedProducts = localStorage.getItem('salon_products');
    const savedServices = localStorage.getItem('salon_services');
    
    if (savedProducts) allProducts = JSON.parse(savedProducts);
    if (savedServices) allServices = JSON.parse(savedServices);
    
    if (allProducts.length > 0 || allServices.length > 0) {
        renderItems();
        showNotification('Using offline data. Some features may be limited.', 'info');
    } else {
        // Show sample data
        showSampleData();
    }
}

function loadBasketFromLocalStorage() {
    const savedBasket = localStorage.getItem('salon_basket');
    if (savedBasket) {
        basketItems = JSON.parse(savedBasket);
        updateBasketDisplay();
    }
}

function addToLocalBasket(item) {
    const existingItem = basketItems.find(bi => bi.id === item.id && bi.type === item.type);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        basketItems.push(item);
    }
    
    localStorage.setItem('salon_basket', JSON.stringify(basketItems));
    updateBasketDisplay();
    showNotification(`${item.name} added to basket!`, 'success');
}

function updateLocalBasketQuantity(itemId, newQuantity) {
    const item = basketItems.find(bi => bi.id === itemId);
    if (item) {
        item.quantity = newQuantity;
        if (item.quantity <= 0) {
            basketItems = basketItems.filter(bi => bi.id !== itemId);
        }
        localStorage.setItem('salon_basket', JSON.stringify(basketItems));
        updateBasketDisplay();
    }
}

function removeFromLocalBasket(itemId) {
    basketItems = basketItems.filter(bi => bi.id !== itemId);
    localStorage.setItem('salon_basket', JSON.stringify(basketItems));
    updateBasketDisplay();
    showNotification('Item removed from basket', 'success');
}

function clearLocalBasket() {
    basketItems = [];
    localStorage.setItem('salon_basket', JSON.stringify(basketItems));
    updateBasketDisplay();
    showNotification('Basket cleared', 'success');
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
    
    // Search input
    searchInput.addEventListener('input', debounce(filterItems, 300));
    
    // Quick view button (delegated)
    contentGrid.addEventListener('click', function(e) {
        const quickviewBtn = e.target.closest('.quickview-btn');
        if (quickviewBtn) {
            const itemId = quickviewBtn.closest('.item-card').dataset.id;
            const itemType = quickviewBtn.closest('.item-card').dataset.type;
            showQuickView(itemId, itemType);
        }
        
        // Add to basket button
        const addToBasketBtn = e.target.closest('.add-to-basket');
        if (addToBasketBtn) {
            const card = addToBasketBtn.closest('.item-card');
            const itemId = card.dataset.id;
                        const itemType = card.dataset.type;
            const item = itemType === 'product' 
                ? allProducts.find(p => p.id === itemId)
                : allServices.find(s => s.id === itemId);
            
            if (item) {
                addItemToBasket(item, itemType);
            }
        }
    });
    
    // Basket toggle
    const basketToggle = document.getElementById('basket-toggle');
    const basketSidebar = document.getElementById('basket-sidebar');
    const closeBasket = document.getElementById('close-basket');
    
    if (basketToggle) {
        basketToggle.addEventListener('click', () => {
            basketSidebar.classList.add('active');
        });
    }
    
    if (closeBasket) {
        closeBasket.addEventListener('click', () => {
            basketSidebar.classList.remove('active');
        });
    }
    
    // Basket item controls (delegated)
    basketItemsContainer.addEventListener('click', function(e) {
        // Remove item button
        if (e.target.closest('.remove-item')) {
            const itemId = e.target.closest('.basket-item').dataset.id;
            removeBasketItem(itemId);
        }
        
        // Quantity decrease button
        if (e.target.closest('.qty-decrease')) {
            const basketItem = e.target.closest('.basket-item');
            const itemId = basketItem.dataset.id;
            const quantityElement = basketItem.querySelector('.quantity');
            let currentQty = parseInt(quantityElement.textContent);
            
            if (currentQty > 1) {
                updateBasketItemQuantity(itemId, currentQty - 1);
            } else {
                removeBasketItem(itemId);
            }
        }
        
        // Quantity increase button
        if (e.target.closest('.qty-increase')) {
            const basketItem = e.target.closest('.basket-item');
            const itemId = basketItem.dataset.id;
            const quantityElement = basketItem.querySelector('.quantity');
            let currentQty = parseInt(quantityElement.textContent);
            
            updateBasketItemQuantity(itemId, currentQty + 1);
        }
    });
    
    // Clear basket button
    const clearBasketBtn = document.getElementById('clear-basket');
    if (clearBasketBtn) {
        clearBasketBtn.addEventListener('click', clearBasket);
    }
    
    // Checkout/Order button
    const checkoutBtn = document.getElementById('checkout-btn');
    const orderModal = document.getElementById('order-modal');
    const closeModal = document.getElementById('close-modal');
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (basketItems.length === 0) {
                showNotification('Your basket is empty!', 'error');
                return;
            }
            updateOrderModal();
            orderModal.classList.add('active');
        });
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            orderModal.classList.remove('active');
        });
    }
    
    // Order method buttons
    const whatsappBtn = document.getElementById('whatsapp-order');
    const smsBtn = document.getElementById('sms-order');
    const callBtn = document.getElementById('call-order');
    
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => placeOrderViaWhatsApp());
    }
    
    if (smsBtn) {
        smsBtn.addEventListener('click', () => placeOrderViaSMS());
    }
    
    if (callBtn) {
        callBtn.addEventListener('click', () => placeOrderViaCall());
    }
}

function switchView(view) {
    currentView = view;
    localStorage.setItem('salonView', view);
    
    // Update active button
    viewToggleBtns.forEach(btn => {
        if (btn.getAttribute('data-view') === view) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    filterItems();
}

function setActiveCategory(category) {
    currentCategory = category;
    localStorage.setItem('salonCategory', category);
    
    // Update active button
    categoryBtns.forEach(btn => {
        if (btn.getAttribute('data-category') === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function filterItems() {
    const searchTerm = searchInput.value.toLowerCase();
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
            (item.description && item.description.toLowerCase().includes(searchTerm)) ||
            item.category.toLowerCase().includes(searchTerm)
        );
    }
    
    renderFilteredItems(itemsToShow);
}

function renderItems() {
    filterItems();
}

function renderFilteredItems(items) {
    contentGrid.innerHTML = '';
    
    if (items.length === 0) {
        contentGrid.innerHTML = `
            <div class="no-items">
                <i class="fas fa-search"></i>
                <h3>No items found</h3>
                <p>Try changing your search or filter criteria</p>
            </div>
        `;
        return;
    }
    
    items.forEach(item => {
        const isProduct = currentView === 'products';
        const card = createItemCard(item, isProduct);
        contentGrid.appendChild(card);
    });
}

function createItemCard(item, isProduct) {
    const card = document.createElement('div');
    card.className = 'item-card fade-in';
    card.dataset.id = item.id;
    card.dataset.type = isProduct ? 'product' : 'service';
    
    const priceFormatted = typeof item.price === 'number' 
        ? `Ksh ${item.price.toLocaleString()}` 
        : `Ksh ${item.price}`;
    
    card.innerHTML = `
        <div class="item-image">
            ${isProduct 
                ? `<img src="${item.image || 'images/default-product.jpg'}" alt="${item.name}">`
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
                <button class="action-btn add-to-basket">
                    <i class="fas fa-shopping-basket"></i> Add to Basket
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function showQuickView(itemId, itemType) {
    const item = itemType === 'product' 
        ? allProducts.find(p => p.id === itemId)
        : allServices.find(s => s.id === itemId);
    
    if (!item) return;
    
    const modal = document.getElementById('quickview-modal');
    const modalContent = modal.querySelector('.quickview-content');
    
    const priceFormatted = typeof item.price === 'number' 
        ? `Ksh ${item.price.toLocaleString()}` 
        : `Ksh ${item.price}`;
    
    modalContent.innerHTML = `
        <div class="quickview-header">
            <button class="close-quickview"><i class="fas fa-times"></i></button>
        </div>
        <div class="quickview-body">
            <div class="quickview-image">
                ${itemType === 'product'
                    ? `<img src="${item.image || 'images/default-product.jpg'}" alt="${item.name}">`
                    : `<div class="quickview-icon">${item.icon || '💅'}</div>`
                }
            </div>
            <div class="quickview-details">
                <h2>${item.name}</h2>
                <div class="quickview-price">${priceFormatted}</div>
                <div class="quickview-category"><i class="fas fa-tag"></i> ${item.category}</div>
                <p class="quickview-description">${item.description || 'No description available'}</p>
                
                ${item.details ? `
                <div class="quickview-specs">
                    <h4>Details:</h4>
                    <ul>
                        ${Object.entries(item.details).map(([key, value]) => 
                            `<li><strong>${key}:</strong> ${value}</li>`
                        ).join('')}
                    </ul>
                </div>` : ''}
                
                <div class="quickview-actions">
                    <button class="add-to-basket-quickview" data-id="${item.id}" data-type="${itemType}">
                        <i class="fas fa-shopping-basket"></i> Add to Basket - ${priceFormatted}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    
    // Add event listeners for quickview modal
    modal.querySelector('.close-quickview').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.querySelector('.add-to-basket-quickview').addEventListener('click', () => {
        addItemToBasket(item, itemType);
        modal.classList.remove('active');
    });
}

function updateBasketDisplay() {
    // Update basket count
    const totalItems = basketItems.reduce((sum, item) => sum + item.quantity, 0);
    basketCount.textContent = totalItems;
    
    // Update basket items list
    if (basketItems.length === 0) {
        basketItemsContainer.innerHTML = `
            <div class="empty-basket">
                <i class="fas fa-shopping-basket"></i>
                <p>Your basket is empty</p>
                <p class="small-text">Add some beautiful items!</p>
            </div>
        `;
        basketTotal.textContent = 'Ksh 0';
        return;
    }
    
    // Calculate total
    let total = 0;
    basketItemsContainer.innerHTML = '';
    
    basketItems.forEach(item => {
        const itemTotal = (typeof item.price === 'number' ? item.price : parseFloat(item.price)) * item.quantity;
        total += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'basket-item';
        itemElement.dataset.id = item.id;
        
        const priceFormatted = typeof item.price === 'number' 
            ? `Ksh ${item.price.toLocaleString()}` 
            : `Ksh ${item.price}`;
        
        const itemTotalFormatted = `Ksh ${itemTotal.toLocaleString()}`;
        
        itemElement.innerHTML = `
            <div class="basket-item-image">
                ${item.type === 'product'
                    ? `<img src="${item.image || 'images/default-product.jpg'}" alt="${item.name}">`
                    : `<div class="basket-item-icon">${item.icon || '💅'}</div>`
                }
            </div>
            <div class="basket-item-details">
                <div class="basket-item-title">
                    <span>${item.name}</span>
                    <span class="basket-item-total">${itemTotalFormatted}</span>
                </div>
                <div class="basket-item-category">${item.category} • ${priceFormatted} each</div>
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
    basketTotal.textContent = `Ksh ${total.toLocaleString()}`;
    
    // Save to localStorage as backup
    localStorage.setItem('salon_basket', JSON.stringify(basketItems));
}

function updateOrderModal() {
    // Update order summary
    let total = 0;
    let summaryHTML = '';
    
    basketItems.forEach(item => {
        const itemTotal = (typeof item.price === 'number' ? item.price : parseFloat(item.price)) * item.quantity;
        total += itemTotal;
        
        summaryHTML += `
            <div class="order-item">
                <span>${item.name} × ${item.quantity}</span>
                <span>Ksh ${itemTotal.toLocaleString()}</span>
            </div>
        `;
    });
    
    orderSummary.innerHTML = summaryHTML;
    orderTotal.textContent = `Ksh ${total.toLocaleString()}`;
}

function placeOrderViaWhatsApp() {
    const customerName = document.getElementById('customer-name').value || 'Customer';
    const customerPhone = document.getElementById('customer-phone').value || '0705455312';
    
    // Build order message
    let message = `Hello! I'd like to place an order:\n\n`;
    let total = 0;
    
    basketItems.forEach(item => {
        const itemTotal = (typeof item.price === 'number' ? item.price : parseFloat(item.price)) * item.quantity;
        total += itemTotal;
        message += `• ${item.name} × ${item.quantity} - Ksh ${itemTotal.toLocaleString()}\n`;
    });
    
    message += `\nTotal: Ksh ${total.toLocaleString()}\n`;
    message += `Name: ${customerName}\n`;
    message += `Phone: ${customerPhone}\n\n`;
    message += `Please confirm availability and payment details.`;
    
    // Submit order to backend first
    const orderData = {
        items: basketItems,
        total: total,
        customerName: customerName,
        customerPhone: customerPhone,
        method: 'whatsapp',
        timestamp: new Date().toISOString()
    };
    
    submitOrder(orderData).then(() => {
        // Open WhatsApp with pre-filled message
        const whatsappUrl = `https://wa.me/254705455312?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        // Close modal
        document.getElementById('order-modal').classList.remove('active');
    }).catch(error => {
        // Still open WhatsApp even if backend fails
        const whatsappUrl = `https://wa.me/254705455312?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        document.getElementById('order-modal').classList.remove('active');
    });
}

function placeOrderViaSMS() {
    const customerName = document.getElementById('customer-name').value || 'Customer';
    const customerPhone = document.getElementById('customer-phone').value || '0705455312';
    
    // Build SMS message
    let message = `ORDER: `;
    let total = 0;
    
    basketItems.forEach(item => {
        const itemTotal = (typeof item.price === 'number' ? item.price : parseFloat(item.price)) * item.quantity;
        total += itemTotal;
        message += `${item.name}(${item.quantity}) `;
    });
    
    message += `Total: Ksh${total}. Name: ${customerName}`;
    
    const orderData = {
        items: basketItems,
        total: total,
        customerName: customerName,
        customerPhone: customerPhone,
        method: 'sms',
        timestamp: new Date().toISOString()
    };
    
    submitOrder(orderData).then(() => {
        // Open SMS app
        const smsUrl = `sms:0705455312?body=${encodeURIComponent(message)}`;
        window.location.href = smsUrl;
        
        document.getElementById('order-modal').classList.remove('active');
    }).catch(error => {
        const smsUrl = `sms:0705455312?body=${encodeURIComponent(message)}`;
        window.location.href = smsUrl;
        document.getElementById('order-modal').classList.remove('active');
    });
}

function placeOrderViaCall() {
    const customerName = document.getElementById('customer-name').value || 'Customer';
    
    const orderData = {
        items: basketItems,
        customerName: customerName,
        method: 'call',
        timestamp: new Date().toISOString()
    };
    
    submitOrder(orderData).then(() => {
        // Initiate phone call
        window.location.href = 'tel:0705455312';
        document.getElementById('order-modal').classList.remove('active');
    }).catch(error => {
        window.location.href = 'tel:0705455312';
        document.getElementById('order-modal').classList.remove('active');
    });
}

// ====== UTILITY FUNCTIONS ======

function showLoading(show) {
    isLoading = show;
    if (show) {
        contentGrid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading from ${API_BASE_URL}...</p>
            </div>
        `;
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'notification error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        errorDiv.classList.remove('show');
        setTimeout(() => errorDiv.remove(), 300);
    }, 5000);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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

function showSampleData() {
    // Sample data for demo purposes
    allProducts = [
        {
            id: '1',
            name: 'Designer Wig',
            price: 2500,
            category: 'wigs',
            description: 'Premium quality synthetic wig',
            image: 'images/wig-sample.jpg'
        },
        {
            id: '2',
            name: 'African Print Bag',
            price: 1200,
            category: 'bags',
            description: 'Handmade African print tote bag',
            image: 'images/bag-sample.jpg'
        }
    ];
    
    allServices = [
        {
            id: 's1',
            name: 'Hair Styling',
            price: 1500,
            category: 'hair',
            description: 'Professional hair styling session',
            icon: '💇',
            duration: '45 min'
        }
    ];
    
    renderItems();
    showNotification('Using sample data. Backend connection required for full features.', 'info');
}
// ====== MOBILE MENU FIX ======
document.addEventListener('DOMContentLoaded', function() {
    // Fix for mobile menu button
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Toggle the mobile menu
            navLinks.classList.toggle('mobile-active');
            mobileMenuBtn.classList.toggle('active');
            
            // Update icon
            const icon = mobileMenuBtn.querySelector('i');
            if (navLinks.classList.contains('mobile-active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Close menu when clicking a link (on mobile)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    navLinks.classList.remove('mobile-active');
                    mobileMenuBtn.classList.remove('active');
                    const icon = mobileMenuBtn.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }
    
    // Close menu when clicking outside (mobile only)
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && 
            navLinks && navLinks.classList.contains('mobile-active') &&
            !navLinks.contains(e.target) && 
            mobileMenuBtn && !mobileMenuBtn.contains(e.target)) {
            navLinks.classList.remove('mobile-active');
            if (mobileMenuBtn) {
                mobileMenuBtn.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });
    
    // Basket toggle fix
    const basketToggle = document.getElementById('basket-toggle');
    const basketSidebar = document.getElementById('basket-sidebar');
    const closeBasket = document.getElementById('close-basket');
    
    if (basketToggle) {
        basketToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            basketSidebar.classList.add('active');
        });
    }
    
    if (closeBasket) {
        closeBasket.addEventListener('click', function() {
            basketSidebar.classList.remove('active');
        });
    }
    
    // Close basket when clicking outside
    document.addEventListener('click', function(e) {
        if (basketSidebar && basketSidebar.classList.contains('active')) {
            if (!basketSidebar.contains(e.target) && 
                !basketToggle.contains(e.target)) {
                basketSidebar.classList.remove('active');
            }
        }
    });
    
    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (basketSidebar && basketSidebar.classList.contains('active')) {
                basketSidebar.classList.remove('active');
            }
            if (navLinks && navLinks.classList.contains('mobile-active')) {
                navLinks.classList.remove('mobile-active');
                mobileMenuBtn.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });
});

// Add CSS for mobile menu
const mobileCSS = `
/* Mobile menu styles */
@media (max-width: 768px) {
    .nav-links {
        display: none;
        position: fixed;
        top: 70px;
        left: 0;
        right: 0;
        background: var(--card-bg);
        padding: 1rem;
        flex-direction: column;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        border-top: 1px solid var(--border-color);
    }
    
    .nav-links.mobile-active {
        display: flex !important;
        animation: slideDown 0.3s ease;
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .nav-links a {
        padding: 1rem;
        margin: 0.25rem 0;
        border-radius: 8px;
        justify-content: flex-start;
        width: 100%;
    }
    
    .mobile-menu-btn {
        display: block;
    }
    
    .mobile-menu-btn.active i {
        color: var(--primary-pink);
    }
}

/* Make basket toggle work as link */
.basket-icon {
    cursor: pointer;
}

.basket-sidebar.active {
    right: 0;
}

/* Handle resizing */
window.addEventListener('resize', function() {
    const navLinks = document.querySelector('.nav-links');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
    if (window.innerWidth > 768) {
        navLinks.classList.remove('mobile-active');
        navLinks.style.display = 'flex';
        if (mobileMenuBtn) {
            mobileMenuBtn.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    } else {
        if (!navLinks.classList.contains('mobile-active')) {
            navLinks.style.display = 'none';
        }
    }
});
`;

// Inject the CSS
const style = document.createElement('style');
style.textContent = mobileCSS;
document.head.appendChild(style);

// Make functions available globally for HTML event handlers
window.addItemToBasket = addItemToBasket;
window.removeBasketItem = removeBasketItem;
window.clearBasket = clearBasket;

