/*
=============================================
BOOKING PAGE JAVASCRIPT
Functionality for booking.html
=============================================
*/

document.addEventListener('DOMContentLoaded', function() {
    // Initialize booking system
    initBookingWizard();
    initCalendar();
    initTimeSlots();
    initFormValidation();
    initWhatsAppBooking();
    initMobileMenu();
    initBackToTop();
    initCopyNumber();
});

// ========== BOOKING WIZARD ==========
function initBookingWizard() {
    const bookingSteps = document.querySelectorAll('.booking-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    const bookingForm = document.getElementById('bookingForm');
    
    // Current step tracking
    let currentStep = 1;
    
    // Initialize first step
    showStep(currentStep);
    
    // Next button click handlers
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const nextStep = parseInt(this.getAttribute('data-next'));
            
            // Validate current step before proceeding
            if (validateStep(currentStep)) {
                currentStep = nextStep;
                showStep(currentStep);
                updateProgress();
            }
        });
    });
    
    // Previous button click handlers
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            const prevStep = parseInt(this.getAttribute('data-prev'));
            currentStep = prevStep;
            showStep(currentStep);
            updateProgress();
        });
    });
    
    // Form submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateStep(4)) {
                submitBooking();
            }
        });
    }
    
    // Service selection
    const serviceOptions = document.querySelectorAll('.service-option');
    const clearSelectionBtn = document.querySelector('.clear-selection');
    
    serviceOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selection from all options
            serviceOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selection to clicked option
            this.classList.add('selected');
            
            // Update service preview
            updateServicePreview(this);
            
            // Update summary
            updateSummary();
        });
    });
    
    // Clear selection
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', function() {
            serviceOptions.forEach(opt => opt.classList.remove('selected'));
            document.getElementById('selectedServicePreview').innerHTML = `
                <div class="no-selection">
                    <i class="fas fa-hand-pointer"></i>
                    <p>Select a service to continue</p>
                </div>
            `;
        });
    }
    
    // Category tabs
    const categoryTabs = document.querySelectorAll('.category-tab');
    
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active tab
            categoryTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Filter services
            filterServicesByCategory(category);
        });
    });
}

function showStep(step) {
    const steps = document.querySelectorAll('.booking-step');
    const currentStepElement = document.querySelector(`.booking-step[data-step="${step}"]`);
    
    // Hide all steps
    steps.forEach(stepElement => {
        stepElement.classList.remove('active');
    });
    
    // Show current step
    currentStepElement.classList.add('active');
}

function updateProgress() {
    const progressSteps = document.querySelectorAll('.progress-step');
    
    progressSteps.forEach(step => {
        const stepNumber = parseInt(step.getAttribute('data-step'));
        
        if (stepNumber <= currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

function validateStep(step) {
    switch(step) {
        case 1:
            return validateServiceSelection();
        case 2:
            return validateDateTimeSelection();
        case 3:
            return validatePersonalDetails();
        case 4:
            return validateConfirmation();
        default:
            return true;
    }
}

function validateServiceSelection() {
    const selectedService = document.querySelector('.service-option.selected');
    
    if (!selectedService) {
        showNotification('Please select a service to continue', 'error');
        return false;
    }
    
    return true;
}

function validateDateTimeSelection() {
    const selectedDate = document.querySelector('.calendar-day.selected');
    const selectedTime = document.querySelector('.time-slot.selected');
    
    if (!selectedDate) {
        showNotification('Please select a date for your appointment', 'error');
        return false;
    }
    
    if (!selectedTime) {
        showNotification('Please select a time slot for your appointment', 'error');
        return false;
    }
    
    return true;
}

function validatePersonalDetails() {
    const fullName = document.getElementById('fullName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const acceptTerms = document.getElementById('acceptTerms').checked;
    
    if (!fullName) {
        showNotification('Please enter your full name', 'error');
        return false;
    }
    
    if (!phoneNumber) {
        showNotification('Please enter your phone number', 'error');
        return false;
    }
    
    if (!validatePhoneNumber(phoneNumber)) {
        showNotification('Please enter a valid phone number', 'error');
        return false;
    }
    
    if (!acceptTerms) {
        showNotification('Please accept the terms and conditions', 'error');
        return false;
    }
    
    return true;
}

function validateConfirmation() {
    // All validations already done in previous steps
    return true;
}

function updateServicePreview(serviceElement) {
    const serviceName = serviceElement.querySelector('.service-option-name').textContent;
    const servicePrice = serviceElement.querySelector('.service-option-price').textContent;
    const serviceDuration = serviceElement.querySelector('.service-option-duration').textContent;
    
    const previewHTML = `
        <div class="selected-service-details">
            <div class="selected-service-item">
                <div class="service-detail-label">Service</div>
                <div class="service-detail-value">${serviceName}</div>
            </div>
            <div class="selected-service-item">
                <div class="service-detail-label">Duration</div>
                <div class="service-detail-value">${serviceDuration}</div>
            </div>
            <div class="selected-service-item service-total">
                <div class="service-detail-label">Total</div>
                <div class="service-detail-value">${servicePrice}</div>
            </div>
        </div>
    `;
    
    document.getElementById('selectedServicePreview').innerHTML = previewHTML;
}

function filterServicesByCategory(category) {
    const serviceOptions = document.querySelectorAll('.service-option');
    
    serviceOptions.forEach(option => {
        const optionCategory = option.getAttribute('data-category');
        
        if (category === 'all' || optionCategory === category) {
            option.style.display = 'block';
        } else {
            option.style.display = 'none';
        }
    });
}

// ========== CALENDAR FUNCTIONALITY ==========
function initCalendar() {
    const calendar = document.getElementById('bookingCalendar');
    const currentMonthEl = document.querySelector('.current-month');
    const prevMonthBtn = document.querySelector('.prev-month');
    const nextMonthBtn = document.querySelector('.next-month');
    
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    // Generate initial calendar
    generateCalendar(currentMonth, currentYear);
    
    // Month navigation
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            generateCalendar(currentMonth, currentYear);
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            generateCalendar(currentMonth, currentYear);
        });
    }
}

function generateCalendar(month, year) {
    const calendar = document.getElementById('bookingCalendar');
    const currentMonthEl = document.querySelector('.current-month');
    
    if (!calendar || !currentMonthEl) return;
    
    // Clear existing calendar
    calendar.innerHTML = '';
    
    // Month names
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Update month display
    currentMonthEl.textContent = `${monthNames[month]} ${year}`;
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay();
    
    // Get days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get today's date
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();
    
    // Previous month days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = 0; i < startingDay; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day disabled';
        day.textContent = prevMonthDays - startingDay + i + 1;
        calendar.appendChild(day);
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.innerHTML = `<span class="day-number">${i}</span>`;
        
        // Check if it's today
        if (year === todayYear && month === todayMonth && i === todayDate) {
            day.classList.add('today');
        }
        
        // Disable past dates
        if (year < todayYear || (year === todayYear && month < todayMonth) || 
            (year === todayYear && month === todayMonth && i < todayDate)) {
            day.classList.add('disabled');
        } else {
            // Add click event for future dates
            day.addEventListener('click', () => selectDate(day, i, month, year));
        }
        
        // Mark weekends
        const dayOfWeek = new Date(year, month, i).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            day.classList.add('weekend');
        }
        
        calendar.appendChild(day);
    }
    
    // Next month days
    const totalCells = 42; // 6 rows * 7 days
    const remainingCells = totalCells - (startingDay + daysInMonth);
    for (let i = 1; i <= remainingCells; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day disabled';
        day.textContent = i;
        calendar.appendChild(day);
    }
}

let selectedDateElement = null;

function selectDate(dateElement, day, month, year) {
    // Remove selection from previous date
    if (selectedDateElement) {
        selectedDateElement.classList.remove('selected');
    }
    
    // Add selection to new date
    dateElement.classList.add('selected');
    selectedDateElement = dateElement;
    
    // Update selected date display
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const selectedDate = `${day} ${monthNames[month]} ${year}`;
    
    // Update summary
    updateSummary();
    
    // Update time slots for selected date
    updateTimeSlots(day, month, year);
}

// ========== TIME SLOTS ==========
function initTimeSlots() {
    // Generate initial time slots for today
    const today = new Date();
    updateTimeSlots(today.getDate(), today.getMonth(), today.getFullYear());
}

function updateTimeSlots(day, month, year) {
    const timeSlotsContainer = document.getElementById('timeSlots');
    if (!timeSlotsContainer) return;
    
    // Clear existing time slots
    timeSlotsContainer.innerHTML = '';
    
    // Salon working hours
    const workingHours = {
        weekdays: { start: 8, end: 19 }, // 8 AM - 7 PM
        saturday: { start: 8, end: 18 }, // 8 AM - 6 PM
        sunday: { start: 10, end: 16 }   // 10 AM - 4 PM
    };
    
    // Get day of week
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    
    // Determine working hours based on day
    let hours;
    if (dayOfWeek === 0) { // Sunday
        hours = workingHours.sunday;
    } else if (dayOfWeek === 6) { // Saturday
        hours = workingHours.saturday;
    } else {
        hours = workingHours.weekdays;
    }
    
    // Generate time slots
    for (let hour = hours.start; hour < hours.end; hour++) {
        for (let minute of [0, 30]) { // 30-minute intervals
            // Format time
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour > 12 ? hour - 12 : hour;
            const displayMinute = minute === 0 ? '00' : '30';
            const timeString = `${displayHour}:${displayMinute} ${period}`;
            
            // Create time slot element
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = timeString;
            
            // Mark some time slots as booked (for demo)
            const isBooked = Math.random() > 0.7; // 30% chance of being booked
            
            if (isBooked) {
                timeSlot.classList.add('booked');
            } else {
                timeSlot.addEventListener('click', () => selectTimeSlot(timeSlot, timeString));
            }
            
            timeSlotsContainer.appendChild(timeSlot);
        }
    }
}

let selectedTimeSlotElement = null;

function selectTimeSlot(timeSlotElement, timeString) {
    // Remove selection from previous time slot
    if (selectedTimeSlotElement) {
        selectedTimeSlotElement.classList.remove('selected');
    }
    
    // Add selection to new time slot
    timeSlotElement.classList.add('selected');
    selectedTimeSlotElement = timeSlotElement;
    
    // Update selected time display
    const selectedDateTime = document.getElementById('selectedDateTime');
    selectedDateTime.innerHTML = `
        <div class="selected-datetime-content">
            <div class="selected-date-label">Selected Date</div>
            <div class="selected-date">${getSelectedDate()}</div>
            <div class="selected-time-label">Selected Time</div>
            <div class="selected-time">${timeString}</div>
        </div>
    `;
    
    // Update summary
    updateSummary();
}

function getSelectedDate() {
    const selectedDateElement = document.querySelector('.calendar-day.selected');
    if (!selectedDateElement) return 'No date selected';
    
    const day = selectedDateElement.querySelector('.day-number').textContent;
    const currentMonthEl = document.querySelector('.current-month');
    const [monthName, year] = currentMonthEl.textContent.split(' ');
    
    return `${day} ${monthName} ${year}`;
}

// ========== FORM VALIDATION ==========
function initFormValidation() {
    // Phone number validation
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
    
    // Real-time validation feedback
    const formInputs = document.querySelectorAll('#bookingForm input, #bookingForm select, #bookingForm textarea');
    
    formInputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    
    // Clear previous error
    clearFieldError(field);
    
    // Check required fields
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Specific field validations
    switch(field.id) {
        case 'phoneNumber':
            if (!validatePhoneNumber(value)) {
                showFieldError(field, 'Please enter a valid phone number');
                return false;
            }
            break;
            
        case 'email':
            if (value && !validateEmail(value)) {
                showFieldError(field, 'Please enter a valid email address');
                return false;
            }
            break;
    }
    
    return true;
}

function showFieldError(field, message) {
    // Remove existing error
    clearFieldError(field);
    
    // Add error class to field
    field.classList.add('error');
    
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.color = 'var(--primary-pink)';
    errorElement.style.fontSize = '12px';
    errorElement.style.marginTop = '5px';
    
    // Insert after field
    field.parentNode.insertBefore(errorElement, field.nextSibling);
}

function clearFieldError(field) {
    field.classList.remove('error');
    
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

function validatePhoneNumber(phone) {
    const phoneRegex = /^[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ========== SUMMARY UPDATES ==========
function updateSummary() {
    // Service summary
    const selectedService = document.querySelector('.service-option.selected');
    if (selectedService) {
        const serviceName = selectedService.querySelector('.service-option-name').textContent;
        const servicePrice = selectedService.querySelector('.service-option-price').textContent;
        
        document.getElementById('summaryService').innerHTML = `
            <div class="summary-label">Service:</div>
            <div class="summary-value">${serviceName}</div>
        `;
        
        document.getElementById('summaryPrice').innerHTML = `
            <div class="summary-label">Price:</div>
            <div class="summary-value">${servicePrice}</div>
        `;
    }
    
    // Date & Time summary
    const selectedDate = getSelectedDate();
    if (selectedDate !== 'No date selected') {
        document.getElementById('summaryDate').innerHTML = `
            <div class="summary-label">Date:</div>
            <div class="summary-value">${selectedDate}</div>
        `;
    }
    
    const selectedTime = document.querySelector('.time-slot.selected');
    if (selectedTime) {
        document.getElementById('summaryTime').innerHTML = `
            <div class="summary-label">Time:</div>
            <div class="summary-value">${selectedTime.textContent}</div>
        `;
    }
    
    // Personal details summary
    const fullName = document.getElementById('fullName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const preferredStylist = document.getElementById('preferredStylist').value;
    
    if (fullName) {
        document.getElementById('summaryName').innerHTML = `
            <div class="summary-label">Name:</div>
            <div class="summary-value">${fullName}</div>
        `;
    }
    
    if (phoneNumber) {
        document.getElementById('summaryPhone').innerHTML = `
            <div class="summary-label">Phone:</div>
            <div class="summary-value">${phoneNumber}</div>
        `;
    }
    
    if (preferredStylist) {
        const stylistSelect = document.getElementById('preferredStylist');
        const selectedOption = stylistSelect.options[stylistSelect.selectedIndex];
        document.getElementById('summaryStylist').innerHTML = `
            <div class="summary-label">Stylist:</div>
            <div class="summary-value">${selectedOption.text}</div>
        `;
    }
    
    // Update modal details
    updateModalDetails();
}

function updateModalDetails() {
    // Service
    const selectedService = document.querySelector('.service-option.selected');
    if (selectedService) {
        const serviceName = selectedService.querySelector('.service-option-name').textContent;
        document.getElementById('modalService').textContent = serviceName;
    }
    
    // Date & Time
    const selectedDate = getSelectedDate();
    const selectedTime = document.querySelector('.time-slot.selected');
    
    if (selectedDate !== 'No date selected' && selectedTime) {
        document.getElementById('modalDateTime').textContent = `${selectedDate} at ${selectedTime.textContent}`;
    }
    
    // Generate booking ID
    const bookingId = 'GG-' + new Date().getFullYear() + '-' + 
                     String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    document.getElementById('bookingId').textContent = bookingId;
}

// ========== BOOKING SUBMISSION ==========
function submitBooking() {
    // Get all booking details
    const bookingData = collectBookingData();
    
    // Create WhatsApp message
    const whatsappMessage = createWhatsAppMessage(bookingData);
    const encodedMessage = encodeURIComponent(whatsappMessage);
    
    // Open WhatsApp
    window.open(`https://wa.me/254705455312?text=${encodedMessage}`, '_blank');
    
    // Show success modal
    showSuccessModal();
    
    // Reset form after delay
    setTimeout(() => {
        resetBookingForm();
    }, 3000);
}

function collectBookingData() {
    const selectedService = document.querySelector('.service-option.selected');
    
    return {
        service: selectedService ? selectedService.querySelector('.service-option-name').textContent : 'Not selected',
        price: selectedService ? selectedService.querySelector('.service-option-price').textContent : '-',
        date: getSelectedDate(),
        time: document.querySelector('.time-slot.selected') ? document.querySelector('.time-slot.selected').textContent : 'Not selected',
        name: document.getElementById('fullName').value,
        phone: document.getElementById('phoneNumber').value,
        email: document.getElementById('email').value,
        stylist: document.getElementById('preferredStylist').value,
        requests: document.getElementById('specialRequests').value,
        updates: document.getElementById('receiveUpdates').checked
    };
}

function createWhatsAppMessage(bookingData) {
    return `*NEW BOOKING REQUEST - GLAMOURGLOW SALON*

*Service Details:*
• Service: ${bookingData.service}
• Price: ${bookingData.price}
• Date: ${bookingData.date}
• Time: ${bookingData.time}

*Customer Details:*
• Name: ${bookingData.name}
• Phone: ${bookingData.phone}
• Email: ${bookingData.email}
• Preferred Stylist: ${bookingData.stylist || 'Any available'}

*Special Requests:*
${bookingData.requests || 'None'}

*Preferences:*
• Receive Updates: ${bookingData.updates ? 'Yes' : 'No'}

*Booking ID:* GG-${Date.now().toString().slice(-6)}

Please confirm this appointment at your earliest convenience.`;
}

function showSuccessModal() {
    const successModal = document.getElementById('successModal');
    successModal.classList.add('active');
    
    // Close modal functionality
    const closeBtn = successModal.querySelector('.modal-close-btn');
    const overlay = successModal.querySelector('.modal-overlay');
    
    closeBtn.addEventListener('click', closeSuccessModal);
    overlay.addEventListener('click', closeSuccessModal);
    
    // Close on escape key
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            closeSuccessModal();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
}

function closeSuccessModal() {
    const successModal = document.getElementById('successModal');
    successModal.classList.remove('active');
}

function resetBookingForm() {
    // Reset to step 1
    currentStep = 1;
    showStep(currentStep);
    updateProgress();
    
    // Clear selections
    document.querySelectorAll('.service-option.selected').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.time-slot.selected').forEach(el => el.classList.remove('selected'));
    
    // Clear form fields
    document.getElementById('bookingForm').reset();
    
    // Clear previews
    document.getElementById('selectedServicePreview').innerHTML = `
        <div class="no-selection">
            <i class="fas fa-hand-pointer"></i>
            <p>Select a service to continue</p>
        </div>
    `;
    
    document.getElementById('selectedDateTime').innerHTML = `
        <div class="no-selection">
            <i class="fas fa-calendar"></i>
            <p>Select date and time</p>
        </div>
    `;
    
    // Reset summary
    document.getElementById('summaryService').innerHTML = `
        <div class="summary-label">Service:</div>
        <div class="summary-value">No service selected</div>
    `;
    
    document.getElementById('summaryPrice').innerHTML = `
        <div class="summary-label">Price:</div>
        <div class="summary-value">-</div>
    `;
    
    // And other summary resets...
}

// ========== WHATSAPP BOOKING ==========
function initWhatsAppBooking() {
    const whatsappBookingBtn = document.querySelector('.whatsapp-btn');
    
    if (whatsappBookingBtn) {
        whatsappBookingBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const defaultMessage = "Hello! I'd like to book an appointment at GlamourGlow Salon. Please let me know available times.";
            const encodedMessage = encodeURIComponent(defaultMessage);
            
            window.open(`https://wa.me/254705455312?text=${encodedMessage}`, '_blank');
        });
    }
}

// ========== COPY PHONE NUMBER ==========
function initCopyNumber() {
    const copyBtn = document.querySelector('.copy-number-btn');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const phoneNumber = '0705455312';
            
            // Use Clipboard API if available
            if (navigator.clipboard) {
                navigator.clipboard.writeText(phoneNumber)
                    .then(() => {
                        showNotification('Phone number copied to clipboard!', 'success');
                    })
                    .catch(err => {
                        console.error('Failed to copy:', err);
                        fallbackCopy(phoneNumber);
                    });
            } else {
                fallbackCopy(phoneNumber);
            }
        });
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Phone number copied to clipboard!', 'success');
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showNotification('Failed to copy phone number', 'error');
    }
    
    document.body.removeChild(textArea);
}

// ========== MOBILE MENU ==========
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
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

// ========== SAMPLE SERVICES DATA ==========
// This would typically come from a database
const sampleServices = [
    { id: 1, category: 'hair', name: 'Haircut & Styling', price: 'KSH 1,500', duration: '1 hour', icon: 'cut' },
    { id: 2, category: 'hair', name: 'Hair Coloring', price: 'KSH 3,500', duration: '2 hours', icon: 'fill-drip' },
    { id: 3, category: 'hair', name: 'Hair Extensions', price: 'KSH 8,000', duration: '3 hours', icon: 'layer-group' },
    { id: 4, category: 'skincare', name: 'Basic Facial', price: 'KSH 2,500', duration: '1 hour', icon: 'spa' },
    { id: 5, category: 'skincare', name: 'Anti-Aging Facial', price: 'KSH 4,000', duration: '1.5 hours', icon: 'leaf' },
    { id: 6, category: 'makeup', name: 'Bridal Makeup', price: 'KSH 5,000', duration: '2 hours', icon: 'heart' },
    { id: 7, category: 'makeup', name: 'Event Makeup', price: 'KSH 3,000', duration: '1.5 hours', icon: 'star' },
    { id: 8, category: 'nails', name: 'Classic Manicure', price: 'KSH 1,200', duration: '45 mins', icon: 'hand-sparkles' },
    { id: 9, category: 'nails', name: 'Gel Nails', price: 'KSH 2,500', duration: '1.5 hours', icon: 'palette' },
    { id: 10, category: 'waxing', name: 'Full Body Wax', price: 'KSH 6,000', duration: '2 hours', icon: 'fire' },
    { id: 11, category: 'bridal', name: 'Bridal Package', price: 'KSH 12,000', duration: '4 hours', icon: 'gem' }
];

// Load sample services on page load
window.addEventListener('load', function() {
    loadSampleServices();
});

function loadSampleServices() {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid) return;
    
    servicesGrid.innerHTML = '';
    
    sampleServices.forEach(service => {
        const serviceOption = document.createElement('div');
        serviceOption.className = 'service-option';
        serviceOption.setAttribute('data-category', service.category);
        serviceOption.setAttribute('data-id', service.id);
        
        serviceOption.innerHTML = `
            <div class="service-option-icon">
                <i class="fas fa-${service.icon}"></i>
            </div>
            <h3 class="service-option-name">${service.name}</h3>
            <div class="service-option-price">${service.price}</div>
            <div class="service-option-duration">
                <i class="fas fa-clock"></i>
                ${service.duration}
            </div>
        `;
        
        servicesGrid.appendChild(serviceOption);
    });
    
    // Re-attach event listeners
    const serviceOptions = document.querySelectorAll('.service-option');
    serviceOptions.forEach(option => {
        option.addEventListener('click', function() {
            serviceOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            updateServicePreview(this);
            updateSummary();
        });
    });
}