// booking.js - Booking page functionality
// Connects to Render backend: https://beautysalon-div4.onrender.com

// ====== CONFIGURATION ======
const API_BASE_URL = 'https://beautysalon-div4.onrender.com';
const API_ENDPOINTS = {
    services: '/api/services',
    bookings: '/api/bookings',
    availability: '/api/availability'
};

// ====== GLOBAL VARIABLES ======
let allServices = [];
let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let bookingData = {
    service: null,
    date: null,
    time: null,
    customer: {},
    notes: ''
};

// ====== DOM ELEMENTS ======
const bookingForm = document.getElementById('booking-form');
const servicesGrid = document.getElementById('services-grid');
const bookingDate = document.getElementById('booking-date');
const timeSlots = document.getElementById('time-slots');
const steps = document.querySelectorAll('.step');
const bookingSteps = document.querySelectorAll('.booking-step');

// Summary elements
const summaryService = document.getElementById('summary-service');
const summaryDate = document.getElementById('summary-date');
const summaryTime = document.getElementById('summary-time');
const summaryDuration = document.getElementById('summary-duration');
const summaryPrice = document.getElementById('summary-price');

// Confirmation elements
const confirmService = document.getElementById('confirm-service');
const confirmDatetime = document.getElementById('confirm-datetime');
const confirmCustomer = document.getElementById('confirm-customer');
const confirmContact = document.getElementById('confirm-contact');
const confirmPrice = document.getElementById('confirm-price');

// Success modal elements
const successModal = document.getElementById('success-modal');
const successMessage = document.getElementById('success-message');
const bookingReference = document.getElementById('booking-reference');
const successDate = document.getElementById('success-date');
const successTime = document.getElementById('success-time');

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing booking page...');
    
    initializePage();
    setupEventListeners();
    await loadServices();
    initializeDatePicker();
});

function initializePage() {
    // Set current step to 1
    setActiveStep(1);
}

function setupEventListeners() {
    // Step navigation
    document.querySelectorAll('.next-step').forEach(btn => {
        btn.addEventListener('click', function() {
            const nextStep = parseInt(this.getAttribute('data-next'));
            if (validateCurrentStep(nextStep - 1)) {
                setActiveStep(nextStep);
                updateSummary();
            }
        });
    });
    
    document.querySelectorAll('.prev-step').forEach(btn => {
        btn.addEventListener('click', function() {
            const prevStep = parseInt(this.getAttribute('data-prev'));
            setActiveStep(prevStep);
        });
    });
    
    // Form submission
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitBooking();
    });
    
    // Success modal buttons
    document.getElementById('add-to-calendar')?.addEventListener('click', addToCalendar);
    document.getElementById('whatsapp-reminder')?.addEventListener('click', sendWhatsAppReminder);
    document.getElementById('new-booking')?.addEventListener('click', startNewBooking);
}

// ====== API FUNCTIONS ======

async function loadServices() {
    try {
        showLoading(true, servicesGrid);
        
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.services}`);
        if (!response.ok) throw new Error('Failed to load services');
        
        allServices = await response.json();
        renderServices();
        showLoading(false, servicesGrid);
        
    } catch (error) {
        console.error('Error loading services:', error);
        showError('Failed to load services. Using sample data.', servicesGrid);
        loadSampleServices();
    }
}

async function checkAvailability(date) {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.availability}?date=${date}`);
        if (response.ok) {
            return await response.json();
        }
        return generateTimeSlots(); // Fallback to generated slots
    } catch (error) {
        console.error('Error checking availability:', error);
        return generateTimeSlots(); // Fallback to generated slots
    }
}

async function submitBooking() {
    try {
        // Prepare booking data
        const bookingPayload = {
            serviceId: selectedService.id,
            serviceName: selectedService.name,
            date: selectedDate,
            time: selectedTime,
            customerName: document.getElementById('customer-name').value,
            customerPhone: document.getElementById('customer-phone').value,
            customerEmail: document.getElementById('customer-email').value || '',
            notes: document.getElementById('special-notes').value || '',
            price: selectedService.price,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };
        
        // Validate required fields
        if (!bookingPayload.customerName || !bookingPayload.customerPhone) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Send to backend
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.bookings}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingPayload)
        });
        
        if (response.ok) {
            const result = await response.json();
            showSuccessModal(result);
            
            // Save to localStorage as backup
            saveBookingToLocalStorage(result);
            
        } else {
            throw new Error('Booking failed');
        }
        
    } catch (error) {
        console.error('Error submitting booking:', error);
        
        // Fallback: Save to localStorage and show success
        const fallbackResult = {
            id: 'LOCAL-' + Date.now(),
            ...bookingPayload,
            reference: 'LOCAL-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        };
        
        saveBookingToLocalStorage(fallbackResult);
        showSuccessModal(fallbackResult);
        showNotification('Booking saved locally (backend offline)', 'info');
    }
}

// ====== UI FUNCTIONS ======

function renderServices() {
    servicesGrid.innerHTML = '';
    
    if (allServices.length === 0) {
        servicesGrid.innerHTML = `
            <div class="no-services">
                <i class="fas fa-spa"></i>
                <h3>No services available</h3>
                <p>Please check back later or contact us directly</p>
            </div>
        `;
        return;
    }
    
    allServices.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.dataset.id = service.id;
        
        const priceFormatted = typeof service.price === 'number' 
            ? `Ksh ${service.price.toLocaleString()}` 
            : `Ksh ${service.price}`;
        
        serviceCard.innerHTML = `
            <div class="service-icon">${service.icon || '💅'}</div>
            <h3 class="service-title">${service.name}</h3>
            <div class="service-price">${priceFormatted}</div>
            <div class="service-duration">
                <i class="fas fa-clock"></i> ${service.duration || '45 min'}
            </div>
            <p class="service-description">${service.description || 'Professional beauty service'}</p>
        `;
        
        serviceCard.addEventListener('click', () => selectService(service));
        servicesGrid.appendChild(serviceCard);
    });
}

function selectService(service) {
    // Remove selection from all cards
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selection to clicked card
    const selectedCard = document.querySelector(`[data-id="${service.id}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    selectedService = service;
    bookingData.service = service;
    
    // Enable next step
    document.querySelector('.next-step[data-next="2"]').disabled = false;
    
    showNotification(`Selected: ${service.name}`, 'success');
}

function initializeDatePicker() {
    // Initialize Flatpickr
    const fp = flatpickr("#booking-date", {
        minDate: "today",
        maxDate: new Date().fp_incr(30), // 30 days from now
        disable: [
            function(date) {
                // Disable Sundays (0 = Sunday)
                return date.getDay() === 0;
            }
        ],
        onChange: async function(selectedDates) {
            if (selectedDates.length > 0) {
                selectedDate = selectedDates[0].toISOString().split('T')[0];
                await loadTimeSlots(selectedDate);
                updateSummary();
            }
        },
        locale: {
            firstDayOfWeek: 1 // Start week on Monday
        }
    });
}

async function loadTimeSlots(date) {
    const slotsContainer = timeSlots.querySelector('.slots-grid');
    slotsContainer.innerHTML = '<div class="loading-dots"><div></div><div></div><div></div></div>';
    
    // Get availability from server
    const availability = await checkAvailability(date);
    
    // Generate time slots (9AM to 7PM, every 45 minutes)
    const slots = availability.availableSlots || generateTimeSlots();
    
    slotsContainer.innerHTML = '';
    
    if (slots.length === 0) {
        slotsContainer.innerHTML = `
            <p class="no-slots">No available slots for this date</p>
        `;
        return;
    }
    
    slots.forEach(slot => {
        const slotElement = document.createElement('div');
        slotElement.className = `time-slot ${slot.available ? '' : 'unavailable'}`;
        slotElement.textContent = slot.time;
        slotElement.dataset.time = slot.time;
        
        if (slot.available) {
            slotElement.addEventListener('click', () => selectTimeSlot(slot.time, slotElement));
        }
        
        slotsContainer.appendChild(slotElement);
    });
}

function selectTimeSlot(time, element) {
    // Remove selection from all slots
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Add selection to clicked slot
    element.classList.add('selected');
    selectedTime = time;
    bookingData.time = time;
    
    // Enable next step
    document.querySelector('.next-step[data-next="3"]').disabled = false;
    
    updateSummary();
}

function setActiveStep(stepNumber) {
    // Update step indicators
    steps.forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.remove('active', 'completed');
        
        if (stepNum < stepNumber) {
            step.classList.add('completed');
        } else if (stepNum === stepNumber) {
            step.classList.add('active');
        }
    });
    
    // Show active step content
    bookingSteps.forEach(step => {
        step.classList.remove('active');
        if (step.id === `step-${stepNumber}`) {
            step.classList.add('active');
        }
    });
    
    // Scroll to top of form
    bookingForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function validateCurrentStep(step) {
    switch(step) {
        case 1:
            if (!selectedService) {
                showNotification('Please select a service first', 'error');
                return false;
            }
            return true;
            
        case 2:
            if (!selectedDate || !selectedTime) {
                showNotification('Please select a date and time', 'error');
                return false;
            }
            return true;
            
        case 3:
            const name = document.getElementById('customer-name').value;
            const phone = document.getElementById('customer-phone').value;
            
            if (!name || !phone) {
                showNotification('Please fill in your name and phone number', 'error');
                return false;
            }
            
            if (phone.length < 10) {
                showNotification('Please enter a valid phone number', 'error');
                return false;
            }
            
            return true;
            
        default:
            return true;
    }
}

function updateSummary() {
    // Update step 3 summary
    if (selectedService) {
        summaryService.textContent = selectedService.name;
        summaryDuration.textContent = selectedService.duration || '45 min';
        summaryPrice.textContent = `Ksh ${typeof selectedService.price === 'number' 
            ? selectedService.price.toLocaleString() 
            : selectedService.price}`;
    }
    
    if (selectedDate) {
        const dateObj = new Date(selectedDate);
        summaryDate.textContent = dateObj.toLocaleDateString('en-KE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    if (selectedTime) {
        summaryTime.textContent = selectedTime;
    }
    
    // Update confirmation step
    if (selectedService) {
        confirmService.textContent = selectedService.name;
        confirmPrice.textContent = `Ksh ${typeof selectedService.price === 'number' 
            ? selectedService.price.toLocaleString() 
            : selectedService.price}`;
    }
    
    if (selectedDate && selectedTime) {
        const dateObj = new Date(selectedDate);
        const dateStr = dateObj.toLocaleDateString('en-KE', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        confirmDatetime.textContent = `${dateStr} at ${selectedTime}`;
    }
    
    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;
    const email = document.getElementById('customer-email').value;
    
    if (name) {
        confirmCustomer.textContent = name;
    }
    
    if (phone || email) {
        confirmContact.textContent = phone;
        if (email) confirmContact.textContent += ` | ${email}`;
    }
}

function showSuccessModal(bookingResult) {
    // Update success modal content
    const dateObj = new Date(selectedDate);
    const dateStr = dateObj.toLocaleDateString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    successMessage.textContent = `Your ${selectedService.name} appointment has been confirmed.`;
    bookingReference.textContent = bookingResult.reference || bookingResult.id;
    successDate.textContent = dateStr;
    successTime.textContent = selectedTime;
    
    // Show modal
    successModal.classList.add('active');
    
    // Reset form after delay
    setTimeout(() => {
        resetBookingForm();
    }, 10000);
}

function resetBookingForm() {
    // Reset selections
    selectedService = null;
    selectedDate = null;
    selectedTime = null;
    bookingData = {
        service: null,
        date: null,
        time: null,
        customer: {},
        notes: ''
    };
    
    // Reset UI
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Clear form fields
    bookingForm.reset();
    document.getElementById('booking-date').value = '';
    
    // Reset to step 1
    setActiveStep(1);
    
    // Hide success modal
    successModal.classList.remove('active');
}

// ====== UTILITY FUNCTIONS ======

function generateTimeSlots() {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 19; // 7 PM
    const interval = 45; // minutes
    
    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += interval) {
            if (hour === endHour - 1 && minute + interval > 60) break;
            
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push({
                time: timeString,
                available: Math.random() > 0.3 // 70% chance of being available
            });
        }
    }
    
    return slots;
}

function showLoading(show, container) {
    if (show) {
        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }
}

function showError(message, container) {
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Connection Error</h3>
            <p>${message}</p>
        </div>
    `;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
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

// ====== SUCCESS MODAL ACTIONS ======

function addToCalendar() {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    const startDate = new Date(`${selectedDate}T${selectedTime}`);
    const endDate = new Date(startDate.getTime() + (parseInt(selectedService.duration) || 45) * 60000);
    
    const calendarEvent = {
        title: `${selectedService.name} - Salon Elegance`,
        description: `Appointment for ${selectedService.name}\nReference: ${bookingReference.textContent}`,
        location: 'Salon Elegance, Nairobi, Kenya',
        start: startDate.toISOString().replace(/-|:|\.\d+/g, ''),
        end: endDate.toISOString().replace(/-|:|\.\d+/g, '')
    };
    
    // Create Google Calendar link
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarEvent.title)}&dates=${calendarEvent.start}/${calendarEvent.end}&details=${encodeURIComponent(calendarEvent.description)}&location=${encodeURIComponent(calendarEvent.location)}`;
    
    window.open(googleCalendarUrl, '_blank');
}

function sendWhatsAppReminder() {
    const message = `Reminder: ${selectedService.name} appointment on ${successDate.textContent} at ${successTime.textContent}. Reference: ${bookingReference.textContent}. See you at Salon Elegance!`;
    const whatsappUrl = `https://wa.me/254705455312?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function startNewBooking() {
    resetBookingForm();
}

// ====== FALLBACK FUNCTIONS ======

function loadSampleServices() {
    allServices = [
        {
            id: 's1',
            name: 'Hair Styling & Treatment',
            price: 1500,
            duration: '60 min',
            description: 'Professional hair styling with treatment',
            icon: '💇',
            category: 'hair'
        },
        {
            id: 's2',
            name: 'Manicure & Pedicure',
            price: 1200,
            duration: '75 min',
            description: 'Complete hand and foot care',
            icon: '💅',
            category: 'nails'
        },
        {
            id: 's3',
            name: 'Facial Treatment',
            price: 2000,
            duration: '90 min',
            description: 'Luxury facial with massage',
            icon: '✨',
            category: 'skin'
        },
        {
            id: 's4',
            name: 'Makeup Application',
            price: 2500,
            duration: '60 min',
            description: 'Professional makeup for events',
            icon: '💄',
            category: 'beauty'
        }
    ];
    
    renderServices();
    showNotification('Using sample services. Backend connection required for real-time availability.', 'info');
}

function saveBookingToLocalStorage(booking) {
    try {
        const existingBookings = JSON.parse(localStorage.getItem('salon_bookings')) || [];
        existingBookings.push(booking);
        localStorage.setItem('salon_bookings', JSON.stringify(existingBookings));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// Make functions available globally for event handlers
window.selectService = selectService;
window.selectTimeSlot = selectTimeSlot;
