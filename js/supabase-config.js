// supabase-config.js - Salon Elegance Supabase Configuration
// Add this in your HTML: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const SUPABASE_CONFIG = {
    URL: 'https://zmvwegkziymxdvjiwuhl.supabase.co',
    ANON_KEY: 'sb_publishable_MVqUz--DuJnuzrx8jyz8ng_5fRxdD-S'
};

// Initialize Supabase client
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
    console.log('✅ Supabase connected successfully');
} catch (error) {
    console.error('❌ Supabase connection failed:', error);
}

// Global variables
const BUCKET_NAME = 'product-images';

// Export for use in other files
window.supabaseClient = supabase;
window.SUPABASE_BUCKET = BUCKET_NAME;

// Toast notification system
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
            max-width: 300px;
        `;
        
        // Mobile positioning
        if (window.innerWidth <= 768) {
            container.style.cssText = `
                position: fixed;
                top: auto;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                right: auto;
                z-index: 9999;
                width: 90%;
                max-width: 300px;
            `;
        }
        
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
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    // Mobile styles
    if (window.innerWidth <= 768) {
        toast.style.cssText = `
            background: ${type === 'success' ? '#10b981' : 
                        type === 'error' ? '#ef4444' : 
                        type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            padding: 16px;
            margin: 10px 0;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideUpMobile 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-size: 14px;
            width: 100%;
        `;
    } else {
        toast.style.cssText = `
            background: ${type === 'success' ? '#10b981' : 
                        type === 'error' ? '#ef4444' : 
                        type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            margin: 10px 0;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
    }
    
    container.appendChild(toast);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        removeToast(toast);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        removeToast(toast);
    }, 5000);
    
    function removeToast(toastElement) {
        if (window.innerWidth <= 768) {
            toastElement.style.animation = 'slideDownMobile 0.3s ease';
        } else {
            toastElement.style.animation = 'slideOut 0.3s ease';
        }
        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.remove();
            }
        }, 300);
    }
}

// Add CSS for animations
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    @keyframes slideUpMobile {
        from { transform: translate(-50%, 100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes slideDownMobile {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, 100%); opacity: 0; }
    }
    .toast-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        margin-left: auto;
        opacity: 0.7;
        transition: opacity 0.2s;
        padding: 4px;
    }
    .toast-close:hover {
        opacity: 1;
    }
`;
document.head.appendChild(toastStyles);

// Export toast function
window.showToast = showToast;

// Test connection on load
if (supabase) {
    supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('Session status:', session ? 'Authenticated' : 'Not authenticated');
    });
}

// Add resize listener for mobile adjustments
window.addEventListener('resize', function() {
    const container = document.getElementById('toast-container');
    if (container && window.innerWidth <= 768) {
        container.style.cssText = `
            position: fixed;
            top: auto;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            right: auto;
            z-index: 9999;
            width: 90%;
            max-width: 300px;
        `;
    } else if (container) {
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 300px;
        `;
    }
});

console.log('✅ Supabase config loaded with mobile support');