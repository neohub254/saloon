// offline-backup.js - Local storage backup system

const OFFLINE_STORAGE = {
    products: 'salon_products_backup',
    services: 'salon_services_backup',
    bookings: 'salon_bookings_backup',
    orders: 'salon_orders_backup',
    admin: 'salon_admin_backup'
};

class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.setupListeners();
        this.checkConnection();
    }
    
    setupListeners() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }
    
    async checkConnection() {
        try {
            await fetch('https://zmvwegkziymxdvjiwuhl.supabase.co', { method: 'HEAD' });
            this.isOnline = true;
            console.log('✅ Online - Supabase connected');
        } catch (error) {
            this.isOnline = false;
            console.log('⚠️ Offline - Using local storage');
            this.showOfflineWarning();
        }
    }
    
    handleOnline() {
        this.isOnline = true;
        console.log('✅ Back online');
        this.hideOfflineWarning();
        this.syncData();
    }
    
    handleOffline() {
        this.isOnline = false;
        console.log('⚠️ Went offline');
        this.showOfflineWarning();
    }
    
    showOfflineWarning() {
        if (document.getElementById('offline-warning')) return;
        
        const warning = document.createElement('div');
        warning.id = 'offline-warning';
        warning.innerHTML = `
            <div class="offline-alert">
                <i class="fas fa-wifi-slash"></i>
                <span>You are offline. Working in offline mode.</span>
                <button class="offline-close"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            #offline-warning {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #f59e0b;
                color: white;
                padding: 12px 20px;
                z-index: 99999;
                text-align: center;
                animation: slideDown 0.3s ease;
            }
            .offline-alert {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                max-width: 1200px;
                margin: 0 auto;
            }
            .offline-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                margin-left: auto;
            }
            @keyframes slideDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }
        `;
        document.head.appendChild(styles);
        
        // Close button
        warning.querySelector('.offline-close').addEventListener('click', () => {
            warning.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => warning.remove(), 300);
        });
    }
    
    hideOfflineWarning() {
        const warning = document.getElementById('offline-warning');
        if (warning) {
            warning.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => warning.remove(), 300);
        }
    }
    
    // Data backup methods
    backupProducts(products) {
        localStorage.setItem(OFFLINE_STORAGE.products, JSON.stringify(products));
        console.log('📦 Products backed up locally');
    }
    
    backupServices(services) {
        localStorage.setItem(OFFLINE_STORAGE.services, JSON.stringify(services));
        console.log('📦 Services backed up locally');
    }
    
    backupBooking(booking) {
        const bookings = this.getBackup(OFFLINE_STORAGE.bookings) || [];
        bookings.push({ ...booking, offline: true, timestamp: Date.now() });
        localStorage.setItem(OFFLINE_STORAGE.bookings, JSON.stringify(bookings));
        console.log('📦 Booking saved offline');
    }
    
    backupOrder(order) {
        const orders = this.getBackup(OFFLINE_STORAGE.orders) || [];
        orders.push({ ...order, offline: true, timestamp: Date.now() });
        localStorage.setItem(OFFLINE_STORAGE.orders, JSON.stringify(orders));
        console.log('📦 Order saved offline');
    }
    
    getBackup(storageKey) {
        const data = localStorage.getItem(storageKey);
        return data ? JSON.parse(data) : null;
    }
    
    async syncData() {
        if (!this.isOnline) return;
        
        console.log('🔄 Syncing offline data...');
        
        // Sync bookings
        const offlineBookings = this.getBackup(OFFLINE_STORAGE.bookings) || [];
        for (const booking of offlineBookings) {
            if (booking.offline) {
                try {
                    const { error } = await supabaseClient
                        .from('bookings')
                        .insert([{
                            customer_name: booking.customer_name,
                            customer_phone: booking.customer_phone,
                            service_name: booking.service_name,
                            date: booking.date,
                            time: booking.time,
                            status: 'pending'
                        }]);
                    
                    if (!error) {
                        // Remove from offline storage
                        offlineBookings.splice(offlineBookings.indexOf(booking), 1);
                    }
                } catch (error) {
                    console.error('Failed to sync booking:', error);
                }
            }
        }
        
        localStorage.setItem(OFFLINE_STORAGE.bookings, JSON.stringify(offlineBookings));
        
        // Sync orders
        const offlineOrders = this.getBackup(OFFLINE_STORAGE.orders) || [];
        // Similar sync logic for orders
        
        console.log('✅ Sync complete');
    }
}

// Initialize offline manager
const offlineManager = new OfflineManager();

// Export for use in other files
window.offlineManager = offlineManager;