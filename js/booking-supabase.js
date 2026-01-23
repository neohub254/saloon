// booking-supabase.js - Booking page functionality
// DIRECT Supabase Connection - NO Render backend needed!

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
    console.log('Initializing booking page with Supabase...');
    
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
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitBooking();
        });
    }
    
    // Success modal buttons
    document.getElementById('add-to-calendar')?.addEventListener('click', addToCalendar);
    document.getElementById('whatsapp-reminder')?.addEventListener('click', sendWhatsAppReminder);
    document.getElementById('new-booking')?.addEventListener('click', startNewBooking);
}

// ====== SUPABASE FUNCTIONS ======

async function loadServices() {
    try {
        showLoading(true, servicesGrid);
        
        const { data: services, error } = await supabaseClient
            .from('services')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        allServices = services || [];
        renderServices();
        showLoading(false, servicesGrid);
        
        console.log(`✅ Loaded ${allServices.length} services from Supabase`);
        
    } catch (error) {
        console.error('Error loading services from Supabase:', error);
        showError('Failed to load services. Using local data.', servicesGrid);
        loadServicesFromLocal();
    }
}

function loadServicesFromLocal() {
    const savedServices = localStorage.getItem('salon_services');
    if (savedServices) {
        allServices = JSON.parse(savedServices);
        renderServices();
        showNotification('Using locally saved services', 'info');
    } else {
        loadSampleServices();
    }
}

async function checkAvailability(date) {
    try {
        // Check existing bookings for this date
        const { data: existingBookings, error } = await supabaseClient
            .from('bookings')
            .select('time')
            .eq('date', date)
            .eq('status', 'confirmed');
        
        if (error) throw error;
        
        const bookedTimes = existingBookings.map(booking => booking.time);
        return generateTimeSlots(bookedTimes);
        
    } catch (error) {
        console.error('Error checking availability:', error);
        return generateTimeSlots([]); // Fallback
    }
}

async function submitBooking() {
    try {
        // Prepare booking data
        const bookingPayload = {
            customer_name: document.getElementById('customer-name').value,
            customer_phone: document.getElementById('customer-phone').value,
            customer_email: document.getElementById('customer-email').value || '',
            service_id: selectedService.id,
            service_name: selectedService.name,
            service_price: selectedService.price,
            date: selectedDate,
            time: selectedTime,
            notes: document.getElementById('special-notes').value || '',
            status: 'confirmed'
        };
        
        // Validate required fields
        if (!bookingPayload.customer_name || !bookingPayload.customer_phone) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Validate phone number
        if (!validatePhoneNumber(bookingPayload.customer_phone)) {
            showNotification('Please enter a valid phone number', 'error');
            return;
        }
        
        // Save to Supabase
        const { data, error } = await supabaseClient
            .from('bookings')
            .insert([bookingPayload])
            .select()
            .single();
        
        if (error) throw error;
        
        // Generate reference
        const reference = 'BK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const bookingResult = {
            ...data,
            reference: reference
        };
        
        // Show success
        showSuccessModal(bookingResult);
        
        // Send WhatsApp confirmation
        sendBookingConfirmation(bookingResult);
        
        // Save to localStorage as backup
        saveBookingToLocalStorage(bookingResult);
        
        console.log('✅ Booking submitted to Supabase');
        
    } catch (error) {
        console.error('Error submitting booking to Supabase:', error);
        
        // Fallback: Save to localStorage
        const fallbackResult = {
            id: 'LOCAL-' + Date.now(),
            customer_name: document.getElementById('customer-name').value,
            customer_phone: document.getElementById('customer-phone').value,
            service_name: selectedService?.name || 'Service',
            date: selectedDate,
            time: selectedTime,
            reference: 'LOCAL-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            status: 'confirmed',
            offline: true
        };
        
        saveBookingToLocalStorage(fallbackResult);
        showSuccessModal(fallbackResult);
        showNotification('Booking saved locally (will sync when online)', 'info');
    }
}

// ====== UI FUNCTIONS (SAME AS BEFORE) ======

function renderServices() {
    if (!servicesGrid) return;
    
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
        
        const priceFormatted = formatCurrency(service.price);
        
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
    const nextStepBtn = document.querySelector('.next-step[data-next="2"]');
    if (nextStepBtn) nextStepBtn.disabled = false;
    
    showNotification(`Selected: ${service.name}`, 'success');
}

function initializeDatePicker() {
    if (!bookingDate) return;
    
    // Set min/max dates
    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    
    bookingDate.min = today;
    bookingDate.max = maxDateStr;
    
    // Add change event
    bookingDate.addEventListener('change', async function() {
        if (this.value) {
            selectedDate = this.value;
            await loadTimeSlots(selectedDate);
            updateSummary();
        }
    });
    
    // Generate time slots for today
    if (today) {
        selectedDate = today;
        loadTimeSlots(today);
    }
}

async function loadTimeSlots(date) {
    if (!timeSlots) return;
    
    const slotsContainer = timeSlots.querySelector('.slots-grid');
    if (!slotsContainer) return;
    
    slotsContainer.innerHTML = '<div class="loading-dots"><div></div><div></div><div></div></div>';
    
    // Get availability
    const availability = await checkAvailability(date);
    const slots = availability.availableSlots || [];
    
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
    const nextStepBtn = document.querySelector('.next-step[data-next="3"]');
    if (nextStepBtn) nextStepBtn.disabled = false;
    
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
    if (bookingForm) {
        bookingForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
            const name = document.getElementById('customer-name')?.value;
            const phone = document.getElementById('customer-phone')?.value;
            
            if (!name || !phone) {
                showNotification('Please fill in your name and phone number', 'error');
                return false;
            }
            
            if (!validatePhoneNumber(phone)) {
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
    if (selectedService && summaryService) {
        summaryService.textContent = selectedService.name;
        if (summaryDuration) summaryDuration.textContent = selectedService.duration || '45 min';
        if (summaryPrice) summaryPrice.textContent = formatCurrency(selectedService.price);
    }
    
    if (selectedDate && summaryDate) {
        const dateObj = new Date(selectedDate);
        summaryDate.textContent = dateObj.toLocaleDateString('en-KE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    if (selectedTime && summaryTime) {
        summaryTime.textContent = selectedTime;
    }
    
    // Update confirmation step
    if (selectedService && confirmService) {
        confirmService.textContent = selectedService.name;
        if (confirmPrice) confirmPrice.textContent = formatCurrency(selectedService.price);
    }
    
    if (selectedDate && selectedTime && confirmDatetime) {
        const dateObj = new Date(selectedDate);
        const dateStr = dateObj.toLocaleDateString('en-KE', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        confirmDatetime.textContent = `${dateStr} at ${selectedTime}`;
    }
    
    const name = document.getElementById('customer-name')?.value;
    const phone = document.getElementById('customer-phone')?.value;
    const email = document.getElementById('customer-email')?.value;
    
    if (name && confirmCustomer) {
        confirmCustomer.textContent = name;
    }
    
    if ((phone || email) && confirmContact) {
        confirmContact.textContent = phone || '';
        if (email && phone) confirmContact.textContent += ` | ${email}`;
        else if (email) confirmContact.textContent = email;
    }
}

function showSuccessModal(bookingResult) {
    if (!successModal || !selectedService || !selectedDate || !selectedTime) return;
    
    // Update success modal content
    const dateObj = new Date(selectedDate);
    const dateStr = dateObj.toLocaleDateString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    if (successMessage) successMessage.textContent = `Your ${selectedService.name} appointment has been confirmed.`;
    if (bookingReference) bookingReference.textContent = bookingResult.reference || bookingResult.id;
    if (successDate) successDate.textContent = dateStr;
    if (successTime) successTime.textContent = selectedTime;
    
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
    if (bookingForm) bookingForm.reset();
    if (bookingDate) bookingDate.value = '';
    
    // Reset to step 1
    setActiveStep(1);
    
    // Hide success modal
    if (successModal) successModal.classList.remove('active');
}

// ====== UTILITY FUNCTIONS ======

function generateTimeSlots(bookedTimes = []) {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 19; // 7 PM
    const interval = 45; // minutes
    
    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += interval) {
            if (hour === endHour - 1 && minute + interval > 60) break;
            
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const isBooked = bookedTimes.includes(timeString);
            
            slots.push({
                time: timeString,
                available: !isBooked
            });
        }
    }
    
    return { availableSlots: slots };
}

function showLoading(show, container) {
    if (!container) return;
    
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
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Connection Error</h3>
            <p>${message}</p>
        </div>
    `;
}

function showNotification(message, type = 'info') {
    // Use global showToast function if available
    if (window.showToast) {
        window.showToast(message, type);
    } else {
        // Fallback simple notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 9999;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

function formatCurrency(amount) {
    return `Ksh ${parseFloat(amount).toLocaleString()}`;
}

function validatePhoneNumber(phone) {
    const phoneRegex = /^(?:254|\+254|0)?(7\d{8})$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
}

// ====== SUCCESS MODAL ACTIONS ======

function addToCalendar() {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    const startDate = new Date(`${selectedDate}T${selectedTime}`);
    const endDate = new Date(startDate.getTime() + (parseInt(selectedService.duration) || 45) * 60000);
    
    const calendarEvent = {
        title: `${selectedService.name} - Salon Elegance`,
        description: `Appointment for ${selectedService.name}\nReference: ${bookingReference?.textContent || ''}`,
        location: 'Salon Elegance, Nairobi, Kenya',
        start: startDate.toISOString().replace(/-|:|\.\d+/g, ''),
        end: endDate.toISOString().replace(/-|:|\.\d+/g, '')
    };
    
    // Create Google Calendar link
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarEvent.title)}&dates=${calendarEvent.start}/${calendarEvent.end}&details=${encodeURIComponent(calendarEvent.description)}&location=${encodeURIComponent(calendarEvent.location)}`;
    
    window.open(googleCalendarUrl, '_blank');
}

function sendWhatsAppReminder() {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    const message = `Reminder: ${selectedService.name} appointment on ${successDate?.textContent || selectedDate} at ${successTime?.textContent || selectedTime}. Reference: ${bookingReference?.textContent || ''}. See you at Salon Elegance!`;
    const whatsappUrl = `https://wa.me/254705455312?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function sendBookingConfirmation(booking) {
    const message = `*Booking Confirmation - Salon Elegance*\n\n` +
                   `Thank you for your booking!\n\n` +
                   `*Service:* ${selectedService.name}\n` +
                   `*Date:* ${formatDate(selectedDate)}\n` +
                   `*Time:* ${selectedTime}\n` +
                   `*Reference:* ${booking.reference || booking.id}\n` +
                   `*Amount:* ${formatCurrency(selectedService.price)}\n\n` +
                   `We look forward to seeing you!`;
    
    const whatsappUrl = `https://wa.me/254705455312?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
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
        }
    ];
    
    renderServices();
    showNotification('Using sample services. Backend connection required for real-time updates.', 'info');
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

console.log('✅ Booking Supabase JS loaded');