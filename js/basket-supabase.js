// basket-supabase.js - Mobile-Optimized Basket Functionality
// Touch-friendly, swipe gestures, haptic feedback

// ====== MOBILE OPTIMIZATION CONFIG ======
const MOBILE_CONFIG = {
    minTouchSize: 44, // Minimum touch target size (iOS guideline)
    longPressDelay: 500, // ms for long press
    swipeThreshold: 50, // pixels for swipe detection
    hapticEnabled: true
};

// ====== GLOBAL VARIABLES ======
let basketItems = [];
let touchStart = { x: 0, y: 0 };
let touchStartTime = 0;
let currentSwipeItem = null;

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', function() {
    console.log('Mobile basket initializing...');
    
    loadBasketFromLocalStorage();
    setupMobileBasket();
    setupTouchEvents();
    setupSwipeGestures();
    
    // Check if on mobile device
    if (isMobileDevice()) {
        optimizeForMobile();
    }
});

// ====== MOBILE DETECTION ======
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// ====== BASKET FUNCTIONS ======
function loadBasketFromLocalStorage() {
    const savedBasket = localStorage.getItem('salon_basket');
    if (savedBasket) {
        try {
            basketItems = JSON.parse(savedBasket);
            updateBasketDisplay();
        } catch (error) {
            console.error('Error loading basket:', error);
            basketItems = [];
        }
    }
}

function saveBasketToLocalStorage() {
    localStorage.setItem('salon_basket', JSON.stringify(basketItems));
}

function updateBasketDisplay() {
    updateBasketCount();
    renderBasketItems();
    updateBasketTotal();
    
    // Auto-save
    saveBasketToLocalStorage();
}

function updateBasketCount() {
    const basketCount = document.getElementById('basket-count');
    if (!basketCount) return;
    
    const totalItems = basketItems.reduce((sum, item) => sum + item.quantity, 0);
    basketCount.textContent = totalItems;
    
    // Add animation for new items
    if (totalItems > 0) {
        basketCount.classList.add('has-items');
        
        // Pulse animation
        basketCount.style.animation = 'pulse 0.5s ease';
        setTimeout(() => {
            basketCount.style.animation = '';
        }, 500);
    } else {
        basketCount.classList.remove('has-items');
    }
}

function renderBasketItems() {
    const basketItemsContainer = document.getElementById('basket-items');
    if (!basketItemsContainer) return;
    
    if (basketItems.length === 0) {
        basketItemsContainer.innerHTML = createEmptyBasketHTML();
        return;
    }
    
    basketItemsContainer.innerHTML = basketItems.map((item, index) => 
        createBasketItemHTML(item, index)
    ).join('');
    
    // Re-attach event listeners after rendering
    attachBasketItemEvents();
}

function createEmptyBasketHTML() {
    return `
        <div class="empty-basket">
            <div class="empty-icon">
                <i class="fas fa-shopping-basket"></i>
            </div>
            <h3>Your basket is empty</h3>
            <p>Add some beautiful items to get started!</p>
            ${isMobileDevice() ? 
                `<button class="action-btn primary" onclick="window.location.href='products-services.html#products'">
                    <i class="fas fa-store"></i> Browse Products
                </button>` : ''
            }
        </div>
    `;
}

function createBasketItemHTML(item, index) {
    const itemTotal = item.price * item.quantity;
    
    return `
        <div class="basket-item" 
             data-id="${item.id}" 
             data-index="${index}"
             style="touch-action: pan-y;">
            <div class="basket-item-image">
                ${item.type === 'product'
                    ? `<img src="${item.image_url || item.image || 'https://via.placeholder.com/80x80?text=Image'}" 
                          alt="${item.name}"
                          loading="lazy">`
                    : `<div class="basket-item-icon">${item.icon || '💅'}</div>`
                }
            </div>
            <div class="basket-item-details">
                <div class="basket-item-header">
                    <h4 class="basket-item-title">${item.name}</h4>
                    <span class="basket-item-price">${formatCurrency(itemTotal)}</span>
                </div>
                <div class="basket-item-info">
                    <span class="basket-item-category">${item.category}</span>
                    <span class="basket-item-unit">${formatCurrency(item.price)} each</span>
                </div>
                <div class="basket-item-controls">
                    <div class="quantity-controls">
                        <button class="qty-btn qty-decrease" 
                                aria-label="Decrease quantity"
                                data-touch-size="large">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="qty-btn qty-increase" 
                                aria-label="Increase quantity"
                                data-touch-size="large">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="remove-item-btn" 
                            aria-label="Remove item"
                            data-touch-size="large"
                            title="Remove from basket">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${isMobileDevice() ? `
                <div class="swipe-action delete-action">
                    <i class="fas fa-trash"></i>
                </div>
            ` : ''}
        </div>
    `;
}

function updateBasketTotal() {
    const basketTotal = document.getElementById('basket-total');
    if (!basketTotal) return;
    
    const total = basketItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    basketTotal.textContent = formatCurrency(total);
}

// ====== BASKET OPERATIONS ======
function addToBasket(item, type = 'product') {
    const existingItem = basketItems.find(bi => bi.id === item.id && bi.type === type);
    
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
    provideHapticFeedback('light');
    showMobileToast(`${item.name} added to basket!`);
}

function removeFromBasket(itemId) {
    basketItems = basketItems.filter(item => item.id !== itemId);
    updateBasketDisplay();
    provideHapticFeedback('medium');
    showMobileToast('Item removed');
}

function updateQuantity(itemId, newQuantity) {
    const item = basketItems.find(item => item.id === itemId);
    if (!item) return;
    
    if (newQuantity <= 0) {
        removeFromBasket(itemId);
    } else {
        item.quantity = newQuantity;
        updateBasketDisplay();
        provideHapticFeedback('light');
    }
}

function clearBasket() {
    if (basketItems.length === 0) return;
    
    // Mobile-friendly confirmation
    if (isMobileDevice()) {
        showMobileConfirm('Clear all items from basket?', () => {
            basketItems = [];
            updateBasketDisplay();
            provideHapticFeedback('heavy');
            showMobileToast('Basket cleared');
        });
    } else {
        if (confirm('Clear all items from basket?')) {
            basketItems = [];
            updateBasketDisplay();
            showToast('Basket cleared', 'success');
        }
    }
}

// ====== MOBILE OPTIMIZATION ======
function optimizeForMobile() {
    console.log('Optimizing for mobile device...');
    
    // Increase touch target sizes
    document.querySelectorAll('button, .clickable').forEach(element => {
        if (element.offsetWidth < MOBILE_CONFIG.minTouchSize || 
            element.offsetHeight < MOBILE_CONFIG.minTouchSize) {
            element.style.minWidth = `${MOBILE_CONFIG.minTouchSize}px`;
            element.style.minHeight = `${MOBILE_CONFIG.minTouchSize}px`;
            element.style.padding = '12px';
        }
    });
    
    // Make quantity buttons larger
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.style.width = '44px';
        btn.style.height = '44px';
        btn.style.fontSize = '20px';
    });
    
    // Add visual feedback for touch
    document.querySelectorAll('.basket-item').forEach(item => {
        item.style.cursor = 'pointer';
    });
}

function setupMobileBasket() {
    const basketSidebar = document.getElementById('basket-sidebar');
    if (!basketSidebar) return;
    
    // Make basket responsive
    if (isMobileDevice()) {
        basketSidebar.style.width = '100%';
        basketSidebar.style.maxWidth = '100%';
        basketSidebar.style.height = '80vh';
        basketSidebar.style.bottom = '0';
        basketSidebar.style.top = 'auto';
        basketSidebar.style.borderRadius = '20px 20px 0 0';
        
        // Add pull indicator
        const pullIndicator = document.createElement('div');
        pullIndicator.className = 'pull-indicator';
        pullIndicator.innerHTML = `<div class="indicator-bar"></div>`;
        basketSidebar.insertBefore(pullIndicator, basketSidebar.firstChild);
    }
}

function setupTouchEvents() {
    // Add touch feedback to all interactive elements
    document.querySelectorAll('.basket-item, button, .clickable').forEach(element => {
        element.addEventListener('touchstart', function(e) {
            this.style.transition = 'none';
            this.style.transform = 'scale(0.98)';
            this.style.opacity = '0.9';
        }, { passive: true });
        
        element.addEventListener('touchend', function(e) {
            this.style.transition = 'transform 0.2s, opacity 0.2s';
            this.style.transform = '';
            this.style.opacity = '';
        }, { passive: true });
        
        element.addEventListener('touchcancel', function(e) {
            this.style.transition = 'transform 0.2s, opacity 0.2s';
            this.style.transform = '';
            this.style.opacity = '';
        }, { passive: true });
    });
}

function setupSwipeGestures() {
    const basketItemsContainer = document.getElementById('basket-items');
    if (!basketItemsContainer || !isTouchDevice()) return;
    
    let startX, startY, currentX;
    let isSwiping = false;
    let currentItem = null;
    
    basketItemsContainer.addEventListener('touchstart', function(e) {
        const item = e.target.closest('.basket-item');
        if (!item) return;
        
        currentItem = item;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        currentX = startX;
        isSwiping = true;
        
        item.style.transition = 'none';
    }, { passive: true });
    
    basketItemsContainer.addEventListener('touchmove', function(e) {
        if (!isSwiping || !currentItem) return;
        
        e.preventDefault();
        currentX = e.touches[0].clientX;
        const diffX = currentX - startX;
        const diffY = Math.abs(e.touches[0].clientY - startY);
        
        // Only horizontal swipe (prevent vertical scroll interference)
        if (Math.abs(diffX) > diffY && Math.abs(diffX) > 10) {
            // Limit swipe distance
            const maxSwipe = 80;
            const translateX = Math.max(-maxSwipe, Math.min(0, diffX));
            currentItem.style.transform = `translateX(${translateX}px)`;
        }
    }, { passive: false });
    
    basketItemsContainer.addEventListener('touchend', function(e) {
        if (!isSwiping || !currentItem) return;
        
        isSwiping = false;
        const diffX = currentX - startX;
        
        currentItem.style.transition = 'transform 0.3s ease';
        
        // If swiped enough, trigger delete
        if (diffX < -MOBILE_CONFIG.swipeThreshold) {
            // Swipe left to delete
            currentItem.style.transform = 'translateX(-100%)';
            currentItem.style.opacity = '0';
            
            setTimeout(() => {
                const itemId = currentItem.dataset.id;
                if (itemId) {
                    removeFromBasket(itemId);
                }
            }, 300);
            
            provideHapticFeedback('medium');
        } else {
            // Return to position
            currentItem.style.transform = 'translateX(0)';
        }
        
        currentItem = null;
    }, { passive: true });
}

function attachBasketItemEvents() {
    // Quantity decrease buttons
    document.querySelectorAll('.qty-decrease').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const itemId = this.closest('.basket-item').dataset.id;
            const item = basketItems.find(item => item.id === itemId);
            
            if (item && item.quantity > 1) {
                updateQuantity(itemId, item.quantity - 1);
            } else if (item) {
                removeFromBasket(itemId);
            }
        });
    });
    
    // Quantity increase buttons
    document.querySelectorAll('.qty-increase').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const itemId = this.closest('.basket-item').dataset.id;
            const item = basketItems.find(item => item.id === itemId);
            
            if (item) {
                updateQuantity(itemId, item.quantity + 1);
            }
        });
    });
    
    // Remove item buttons
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const itemId = this.closest('.basket-item').dataset.id;
            removeFromBasket(itemId);
        });
    });
    
    // Long press for quick actions on mobile
    if (isTouchDevice()) {
        document.querySelectorAll('.basket-item').forEach(item => {
            let longPressTimer;
            
            item.addEventListener('touchstart', function(e) {
                longPressTimer = setTimeout(() => {
                    showItemActions(this.dataset.id);
                    provideHapticFeedback('medium');
                }, MOBILE_CONFIG.longPressDelay);
            }, { passive: true });
            
            item.addEventListener('touchend', function(e) {
                clearTimeout(longPressTimer);
            }, { passive: true });
            
            item.addEventListener('touchmove', function(e) {
                clearTimeout(longPressTimer);
            }, { passive: true });
        });
    }
}

// ====== MOBILE UI FEEDBACK ======
function provideHapticFeedback(type = 'light') {
    if (!MOBILE_CONFIG.hapticEnabled || !navigator.vibrate) return;
    
    const patterns = {
        'light': [50],
        'medium': [100],
        'heavy': [150],
        'success': [50, 50, 50],
        'error': [200]
    };
    
    navigator.vibrate(patterns[type] || patterns.light);
}

function showMobileToast(message, duration = 2000) {
    // Remove existing toast
    const existingToast = document.getElementById('mobile-toast');
    if (existingToast) existingToast.remove();
    
    // Create toast
    const toast = document.createElement('div');
    toast.id = 'mobile-toast';
    toast.innerHTML = message;
    
    // Style for mobile
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '16px 24px',
        borderRadius: '25px',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '9999',
        maxWidth: '80%',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.3s ease'
    });
    
    document.body.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showMobileConfirm(message, onConfirm) {
    // Remove existing confirm
    const existingConfirm = document.getElementById('mobile-confirm');
    if (existingConfirm) existingConfirm.remove();
    
    // Create confirm overlay
    const confirmOverlay = document.createElement('div');
    confirmOverlay.id = 'mobile-confirm';
    
    confirmOverlay.innerHTML = `
        <div class="confirm-backdrop"></div>
        <div class="confirm-dialog">
            <div class="confirm-message">${message}</div>
            <div class="confirm-buttons">
                <button class="confirm-btn cancel-btn">Cancel</button>
                <button class="confirm-btn confirm-action-btn">Clear</button>
            </div>
        </div>
    `;
    
    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
        #mobile-confirm {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .confirm-backdrop {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
        }
        .confirm-dialog {
            background: white;
            border-radius: 16px;
            padding: 24px;
            width: 80%;
            max-width: 300px;
            z-index: 10001;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: scaleIn 0.3s ease;
        }
        .confirm-message {
            font-size: 16px;
            margin-bottom: 20px;
            text-align: center;
            color: #333;
        }
        .confirm-buttons {
            display: flex;
            gap: 12px;
        }
        .confirm-btn {
            flex: 1;
            padding: 14px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .cancel-btn {
            background: #f0f0f0;
            color: #666;
        }
        .confirm-action-btn {
            background: #ef4444;
            color: white;
        }
        @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(confirmOverlay);
    
    // Add event listeners
    confirmOverlay.querySelector('.cancel-btn').addEventListener('click', () => {
        confirmOverlay.remove();
        styles.remove();
    });
    
    confirmOverlay.querySelector('.confirm-action-btn').addEventListener('click', () => {
        onConfirm();
        confirmOverlay.remove();
        styles.remove();
    });
    
    // Close on backdrop click
    confirmOverlay.querySelector('.confirm-backdrop').addEventListener('click', () => {
        confirmOverlay.remove();
        styles.remove();
    });
}

function showItemActions(itemId) {
    // Show quick actions menu for item
    const item = basketItems.find(item => item.id === itemId);
    if (!item) return;
    
    showMobileToast(`Quick actions for ${item.name}`);
    
    // You could expand this to show a menu with:
    // - Remove
    // - Move to wishlist
    // - Save for later
}

// ====== UTILITY FUNCTIONS ======
function formatCurrency(amount) {
    return `Ksh ${parseFloat(amount).toLocaleString()}`;
}

function showToast(message, type = 'info') {
    // Use existing toast function or fallback
    if (window.showToast) {
        window.showToast(message, type);
    } else {
        console.log(`${type}: ${message}`);
    }
}

// ====== GLOBAL FUNCTIONS ======
window.addToBasket = addToBasket;
window.removeFromBasket = removeFromBasket;
window.clearBasket = clearBasket;
window.updateQuantity = updateQuantity;

// Export basket items for other scripts
window.getBasketItems = () => basketItems;
window.setBasketItems = (items) => {
    basketItems = items;
    updateBasketDisplay();
};

// Initialize mobile optimizations
if (isMobileDevice()) {
    // Add mobile-specific CSS
    const mobileCSS = document.createElement('style');
    mobileCSS.textContent = `
        @media (max-width: 768px) {
            .basket-item {
                padding: 12px;
                margin-bottom: 8px;
                border-radius: 12px;
            }
            .quantity-controls {
                gap: 8px;
            }
            .qty-btn {
                width: 44px !important;
                height: 44px !important;
                font-size: 20px !important;
            }
            .quantity-display {
                font-size: 18px;
                min-width: 30px;
                text-align: center;
            }
            .remove-item-btn {
                width: 44px !important;
                height: 44px !important;
                font-size: 18px !important;
            }
            .swipe-action {
                position: absolute;
                right: 0;
                top: 0;
                bottom: 0;
                width: 80px;
                background: #ef4444;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 0 12px 12px 0;
                opacity: 0;
                transition: opacity 0.3s;
            }
            .basket-item.swiping .swipe-action {
                opacity: 1;
            }
        }
        
        /* Animations */
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        @keyframes slideUp {
            from { transform: translate(-50%, 100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes slideDown {
            from { transform: translate(-50%, 0); opacity: 1; }
            to { transform: translate(-50%, 100%); opacity: 0; }
        }
        
        /* Touch feedback */
        .basket-item:active {
            background-color: rgba(0,0,0,0.05);
        }
    `;
    document.head.appendChild(mobileCSS);
}

console.log('✅ Mobile-optimized basket loaded');