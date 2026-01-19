/*
=============================================
GLAMOURGLOW SALON - MAIN JAVASCRIPT
Frontend interactivity and animations
=============================================
*/

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initLoadingScreen();
    initNavigation();
    initHeroAnimations();
    initServiceCards();
    initProductCards();
    initGallery();
    initContactForm();
    initStatsCounter();
    initAdminLogin();
    initScrollAnimations();
    initBackToTop();
    initMobileMenu();
    initParticles();
    initQuickView();
});

// ========== LOADING SCREEN ==========
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (!loadingScreen) return;
    
    // Simulate loading time
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';
        
        // Remove from DOM after animation
        setTimeout(() => {
            loadingScreen.remove();
        }, 500);
    }, 2000);
}

// ========== NAVIGATION ==========
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;
    
    // Add scroll effect to navbar
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Update active nav link based on current page
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const dataSection = link.getAttribute('data-section');
        
        // Check if link points to current page
        if (currentPath.includes(href.replace('.html', '')) || 
            (dataSection && currentPath.includes(dataSection))) {
            link.classList.add('active');
        }
        
        // Add click handler for smooth scroll
        if (href.startsWith('#')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        }
    });
}

// ========== MOBILE MENU ==========
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-nav-list a');
    
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
        
        // Close menu when clicking links
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
            }
        });
    }
}

// ========== HERO ANIMATIONS ==========
function initHeroAnimations() {
    // Create floating particles
    const particleContainer = document.getElementById('particles');
    if (particleContainer) {
        for (let i = 0; i < 50; i++) {
            createParticle(particleContainer);
        }
    }
    
    // Animate 3D cards
    const flipCards = document.querySelectorAll('.flip-card');
    flipCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.zIndex = '100';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.zIndex = '1';
        });
    });
}

// ========== PARTICLE SYSTEM ==========
function initParticles() {
    const container = document.querySelector('.particle-container');
    if (!container) return;
    
    const particleCount = window.innerWidth < 768 ? 20 : 50;
    
    for (let i = 0; i < particleCount; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random properties
    const size = Math.random() * 4 + 1;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 5;
    const opacity = Math.random() * 0.5 + 0.1;
    
    // Apply styles
    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, var(--primary-pink), var(--accent-gold));
        border-radius: 50%;
        top: ${posY}%;
        left: ${posX}%;
        opacity: ${opacity};
        animation: floatParticle ${duration}s linear infinite ${delay}s;
    `;
    
    // Add custom animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatParticle {
            0% {
                transform: translate(0, 0) rotate(0deg);
                opacity: ${opacity};
            }
            25% {
                transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(90deg);
                opacity: ${opacity * 0.5};
            }
            50% {
                transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(180deg);
                opacity: ${opacity};
            }
            75% {
                transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(270deg);
                opacity: ${opacity * 0.5};
            }
            100% {
                transform: translate(0, 0) rotate(360deg);
                opacity: ${opacity};
            }
        }
    `;
    
    document.head.appendChild(style);
    container.appendChild(particle);
}

// ========== SERVICE CARDS ==========
function initServiceCards() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const glow = card.querySelector('.service-hover-glow');
            if (glow) {
                glow.style.left = '100%';
            }
            
            // Add subtle scale effect
            card.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            const glow = card.querySelector('.service-hover-glow');
            if (glow) {
                glow.style.left = '-100%';
            }
            
            // Reset scale
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// ========== PRODUCT CARDS ==========
function initProductCards() {
    const productCards = document.querySelectorAll('.product-card');
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    
    // Add tilt effect to product cards
    productCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 768) return;
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateY = (x - centerX) / 25;
            const rotateX = (centerY - y) / 25;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });
    
    // Add to cart functionality
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get product info
            const productCard = btn.closest('.product-card');
            const productName = productCard.querySelector('.product-title').textContent;
            const productPrice = productCard.querySelector('.current-price').textContent;
            
            // Create WhatsApp message
            const message = `Hello! I'm interested in purchasing:\nProduct: ${productName}\nPrice: ${productPrice}\nPlease let me know how to proceed.`;
            const encodedMessage = encodeURIComponent(message);
            const phoneNumber = '254705455312';
            
            // Open WhatsApp
            window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
            
            // Show notification
            showNotification('Product added to cart! Check WhatsApp to complete purchase.', 'success');
        });
    });
}

// ========== QUICK VIEW MODAL ==========
function initQuickView() {
    const quickViewBtns = document.querySelectorAll('.quick-view-btn');
    const quickViewModal = document.querySelector('.quick-view-modal');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    
    if (!quickViewModal) return;
    
    quickViewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.getAttribute('data-product');
            showQuickView(productId);
        });
    });
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            quickViewModal.classList.remove('active');
        });
    }
    
    // Close modal when clicking outside
    quickViewModal.addEventListener('click', (e) => {
        if (e.target === quickViewModal) {
            quickViewModal.classList.remove('active');
        }
    });
    
    // Close with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && quickViewModal.classList.contains('active')) {
            quickViewModal.classList.remove('active');
        }
    });
}

function showQuickView(productId) {
    const modal = document.querySelector('.quick-view-modal');
    const modalBody = modal.querySelector('.modal-body');
    
    // Sample product data
    const products = {
        1: {
            name: 'Organic Hair Serum',
            category: 'Hair Care',
            price: 'KSH 2,500',
            oldPrice: 'KSH 3,000',
            description: 'Premium organic hair serum that nourishes and protects hair from damage. Made with natural ingredients like argan oil, coconut oil, and vitamin E.',
            features: ['Reduces frizz', 'Adds shine', 'Protects from heat', 'Strengthens hair'],
            image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        2: {
            name: 'Premium Facial Cream',
            category: 'Skincare',
            price: 'KSH 3,200',
            oldPrice: '',
            description: 'Anti-aging facial cream with natural ingredients that hydrates and rejuvenates skin. Contains hyaluronic acid, vitamin C, and retinol.',
            features: ['Anti-aging', 'Hydrating', 'Brightening', 'Non-greasy'],
            image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        3: {
            name: 'Nail Care Kit',
            category: 'Nail Care',
            price: 'KSH 4,800',
            oldPrice: 'KSH 6,000',
            description: 'Complete professional nail care kit with everything you need for perfect nails. Includes nail clippers, files, buffers, and cuticle tools.',
            features: ['Professional tools', 'Durable case', 'Complete set', 'Easy to use'],
            image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        }
    };
    
    const product = products[productId];
    if (!product) return;
    
    // Create modal content
    modalBody.innerHTML = `
        <div class="quick-view-content">
            <div class="row">
                <div class="col-md-6">
                    <div class="product-image-large" style="background-image: url('${product.image}')"></div>
                </div>
                <div class="col-md-6">
                    <div class="product-details">
                        <div class="product-category">${product.category}</div>
                        <h3>${product.name}</h3>
                        <div class="product-price">
                            <span class="current-price">${product.price}</span>
                            ${product.oldPrice ? `<span class="old-price">${product.oldPrice}</span>` : ''}
                        </div>
                        <p class="product-description">${product.description}</p>
                        <div class="product-features">
                            <h4>Features:</h4>
                            <ul>
                                ${product.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="product-actions">
                            <button class="add-to-cart-btn full-width">
                                <i class="fas fa-shopping-cart"></i>
                                <span>Add to Cart</span>
                            </button>
                            <button class="whatsapp-order-btn">
                                <i class="fab fa-whatsapp"></i>
                                <span>Order via WhatsApp</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    modal.classList.add('active');
    
    // Add event listeners to new buttons
    const addToCartBtn = modalBody.querySelector('.add-to-cart-btn');
    const whatsappBtn = modalBody.querySelector('.whatsapp-order-btn');
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            const message = `Hello! I want to order:\nProduct: ${product.name}\nPrice: ${product.price}`;
            window.open(`https://wa.me/254705455312?text=${encodeURIComponent(message)}`, '_blank');
        });
    }
    
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            const message = `Hello! I want to order via WhatsApp:\nProduct: ${product.name}\nPrice: ${product.price}`;
            window.open(`https://wa.me/254705455312?text=${encodeURIComponent(message)}`, '_blank');
        });
    }
}

// ========== GALLERY ==========
function initGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const imageUrl = item.querySelector('.gallery-image').style.backgroundImage;
            const title = item.querySelector('h4').textContent;
            const description = item.querySelector('p').textContent;
            
            // Open image in lightbox
            openLightbox(imageUrl, title, description);
        });
    });
}

function openLightbox(imageUrl, title, description) {
    // Create lightbox
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-content">
            <button class="close-lightbox"><i class="fas fa-times"></i></button>
            <div class="lightbox-image" style="background-image: ${imageUrl}"></div>
            <div class="lightbox-info">
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(lightbox);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .lightbox {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 15, 26, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1002;
            animation: fadeIn 0.3s ease;
        }
        
        .lightbox-content {
            position: relative;
            max-width: 90%;
            max-height: 90%;
        }
        
        .lightbox-image {
            width: 600px;
            height: 400px;
            background-size: cover;
            background-position: center;
            border-radius: 10px;
        }
        
        .lightbox-info {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-bottom-left-radius: 10px;
            border-bottom-right-radius: 10px;
        }
        
        .close-lightbox {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.5);
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            z-index: 1003;
        }
    `;
    
    document.head.appendChild(style);
    
    // Add close functionality
    const closeBtn = lightbox.querySelector('.close-lightbox');
    closeBtn.addEventListener('click', () => {
        lightbox.style.opacity = '0';
        setTimeout(() => {
            lightbox.remove();
            style.remove();
        }, 300);
    });
    
    // Close on escape key
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            lightbox.remove();
            style.remove();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
    
    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.remove();
            style.remove();
        }
    });
}

// ========== CONTACT FORM ==========
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value
            };
            
            // Validate form
            if (!formData.name || !formData.phone || !formData.message) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            // Create WhatsApp message
            const whatsappMessage = `New Contact Form Submission:
Name: ${formData.name}
Phone: ${formData.phone}
Email: ${formData.email}
Message: ${formData.message}`;
            
            const encodedMessage = encodeURIComponent(whatsappMessage);
            
            // Open WhatsApp with the message
            window.open(`https://wa.me/254705455312?text=${encodedMessage}`, '_blank');
            
            // Show success notification
            showNotification('Message sent! Check WhatsApp for confirmation.', 'success');
            
            // Reset form
            contactForm.reset();
        });
    }
}

// ========== STATS COUNTER ==========
function initStatsCounter() {
    const statValues = document.querySelectorAll('.stat-value');
    
    // Check if stats are in viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    const statsContainer = document.querySelector('.stats-container');
    if (statsContainer) {
        observer.observe(statsContainer);
    }
}

function animateCounters() {
    const counters = document.querySelectorAll('.stat-value[data-count]');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const suffix = counter.textContent.includes('.') ? 1 : 0;
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = suffix ? current.toFixed(1) : Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = suffix ? target.toFixed(1) : target;
            }
        };
        
        updateCounter();
    });
}

// ========== ADMIN LOGIN ==========
function initAdminLogin() {
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const loginModal = document.querySelector('.login-modal');
    const closeLoginModal = document.querySelector('.close-login-modal');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const showPasswordBtn = document.querySelector('.show-password');
    
    if (adminLoginBtn && loginModal) {
        adminLoginBtn.addEventListener('click', () => {
            loginModal.classList.add('active');
        });
    }
    
    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', () => {
            loginModal.classList.remove('active');
        });
    }
    
    // Close modal when clicking outside
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.classList.remove('active');
            }
        });
    }
    
    // Show/hide password
    if (showPasswordBtn) {
        showPasswordBtn.addEventListener('click', () => {
            const passwordInput = document.getElementById('adminPassword');
            const icon = showPasswordBtn.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
    
    // Admin login form submission
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const password = document.getElementById('adminPassword').value;
            const defaultPassword = 'admin123';
            
            if (password === defaultPassword) {
                // Save login state
                sessionStorage.setItem('admin_logged_in', 'true');
                
                // Redirect to admin page
                window.location.href = 'admin.html';
            } else {
                showNotification('Incorrect password. Try: admin123', 'error');
                adminLoginForm.classList.add('shake');
                setTimeout(() => {
                    adminLoginForm.classList.remove('shake');
                }, 500);
            }
        });
    }
}

// ========== SCROLL ANIMATIONS ==========
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.text-reveal, .fade-in, .slide-in-left, .slide-in-right');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.style.clipPath = 'inset(0 0 0 0)';
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// ========== BACK TO TOP ==========
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.style.opacity = '1';
                backToTopBtn.style.visibility = 'visible';
            } else {
                backToTopBtn.style.opacity = '0';
                backToTopBtn.style.visibility = 'hidden';
            }
        });
        
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// ========== NOTIFICATION SYSTEM ==========
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="close-notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--navy-dark);
            border-left: 4px solid;
            border-color: ${type === 'success' ? 'var(--lime-green)' : type === 'error' ? 'var(--primary-pink)' : 'var(--accent-gold)'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            min-width: 300px;
            max-width: 400px;
            z-index: 1003;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        
        .notification i {
            font-size: 20px;
            color: ${type === 'success' ? 'var(--lime-green)' : type === 'error' ? 'var(--primary-pink)' : 'var(--accent-gold)'};
        }
        
        .close-notification {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            transition: var(--transition-smooth);
        }
        
        .close-notification:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Add close functionality
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 300);
        }
    }, 5000);
}

// ========== FORM VALIDATION ==========
function validatePhoneNumber(phone) {
    const phoneRegex = /^[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ========== WINDOW RESIZE HANDLER ==========
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Reinitialize particles on resize
        const particleContainer = document.querySelector('.particle-container');
        if (particleContainer) {
            particleContainer.innerHTML = '';
            initParticles();
        }
    }, 250);
});

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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}