// basket.js - Basket-specific functionality

// Initialize basket event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Close basket when clicking outside
    document.addEventListener('click', function(e) {
        const basketSidebar = document.getElementById('basket-sidebar');
        const basketToggle = document.getElementById('basket-toggle');
        
        if (basketSidebar && basketSidebar.classList.contains('active')) {
            if (!basketSidebar.contains(e.target) && 
                !basketToggle.contains(e.target) && 
                e.target !== basketToggle) {
                basketSidebar.classList.remove('active');
            }
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal-overlay.active');
            modals.forEach(modal => modal.classList.remove('active'));
            
            const basket = document.getElementById('basket-sidebar');
            if (basket) basket.classList.remove('active');
        }
    });
});

// Toggle basket visibility
function toggleBasket() {
    const basketSidebar = document.getElementById('basket-sidebar');
    if (basketSidebar) {
        basketSidebar.classList.toggle('active');
    }
}

// Calculate basket total
function calculateBasketTotal() {
    let total = 0;
    basketItems.forEach(item => {
        const price = typeof item.price === 'number' ? item.price : parseFloat(item.price);
        total += price * item.quantity;
    });
    return total;
}

// Format currency
function formatCurrency(amount) {
    return `Ksh ${amount.toLocaleString()}`;
}
