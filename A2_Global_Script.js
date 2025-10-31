// Function to show the custom alert
function showCustomAlert(message) {
  const alertBox = document.getElementById('custom-alert');
  const alertMessage = document.getElementById('custom-alert-message');
  
  alertMessage.textContent = message;
  alertBox.style.display = 'flex'; // Use 'flex' to center the content
  
  const closeButton = document.querySelector('.custom-alert-close');
  closeButton.onclick = function() {
    alertBox.style.display = 'none';
  };
  
  // Close the alert when the user clicks outside the content
  window.onclick = function(event) {
    if (event.target === alertBox) {
      alertBox.style.display = 'none';
    }
  };
}

// =============================================== SCRIPT FOR LOGIN MODAL ===============================================

// Function to handle showing/hiding the modal
function toggleModal(show) {
    const modal = document.getElementById("loginModal");
    modal.style.display = show ? "block" : "none";
}

// Function to check if the user is logged in
function isLoggedIn() {
    return localStorage.getItem("loggedIn") === "true";
}

// Function to check if user is an employee
function isEmployee() {
    const username = localStorage.getItem("username");
    return username && username.startsWith("AZEmp");
}

// Function to update the header based on login status
function updateHeaderControls() {
    const authBtn = document.getElementById("authBtn");
    const welcomeMessage = document.getElementById("welcomeMessage");
    
    if (isLoggedIn()) {
        const username = localStorage.getItem("username");
        welcomeMessage.textContent = `Welcome, ${username}!`;
        welcomeMessage.classList.remove("hidden");
        authBtn.textContent = "Logout";
        authBtn.onclick = handleLogout;
    } else {
        welcomeMessage.classList.add("hidden");
        authBtn.textContent = "Login";
        authBtn.onclick = () => toggleModal(true);
    }
}

// Function to handle the login process
function handleLogin(event) {
    event.preventDefault();
    const usernameInput = document.getElementById("username");
    const username = usernameInput.value;

    if (username) {
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("username", username);
        
        // Check if employee and redirect accordingly
        if (username.startsWith("AZEmp")) {
            window.location.href = 'A2_EmployeePage.html';
        } else {
            updateHeaderControls();
            toggleModal(false);
        }
    } else {
        alert("Please enter a username.");
    }
}

// Function to handle the logout process
function handleLogout() {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("username");
    updateHeaderControls();
    window.location.href = 'index.html';
}

// Event listeners for page load and button clicks
document.addEventListener("DOMContentLoaded", () => {
    updateHeaderControls();

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    const closeBtn = document.querySelector("#loginModal .close-btn");
    if (closeBtn) {
        closeBtn.onclick = () => toggleModal(false);
    }

    window.onclick = function(event) {
        const modal = document.getElementById("loginModal");
        if (event.target === modal) {
            toggleModal(false);
        }
    };
});



// =============================================== SCRIPT FOR COLLECTION PAGE ===============================================
document.addEventListener('DOMContentLoaded', () => {
    const checkboxes = document.querySelectorAll('.c-page-filter-checkbox');
    const items = document.querySelectorAll('.vehicle-card');

    if (checkboxes.length > 0) {
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', filterItems);
        });

        function filterItems() {
            const selectedTags = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value.toLowerCase());

            items.forEach(item => {
                const itemTags = item.dataset.tags
                    .split(',')
                    .map(tag => tag.trim().toLowerCase());

                const matchesAll = selectedTags.every(tag => itemTags.includes(tag));

                if (selectedTags.length === 0 || matchesAll) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        }
    }
});

// =============================================== BOOKING MANAGEMENT FUNCTIONS ===============================================

// Initialize bookings in localStorage if not exists
function initializeBookings() {
    if (!localStorage.getItem("bookings")) {
        localStorage.setItem("bookings", JSON.stringify([]));
    }
}

// Get all bookings
function getAllBookings() {
    initializeBookings();
    return JSON.parse(localStorage.getItem("bookings") || "[]");
}

// Get bookings for a specific user
function getUserBookings(username) {
    const allBookings = getAllBookings();
    return allBookings.filter(booking => booking.username === username);
}

// Get bookings by location
function getBookingsByLocation(location) {
    const allBookings = getAllBookings();
    return allBookings.filter(booking => booking.collectLocation === location);
}

// Add a new booking
function addBooking(bookingData) {
    const bookings = getAllBookings();
    const newBooking = {
        id: generateBookingId(),
        username: localStorage.getItem("username"),
        ...bookingData,
        status: "Booked",
        createdAt: new Date().toISOString(),
        actualDropOff: null,
        additionalCharges: 0,
        reviewData: null
    };
    bookings.push(newBooking);
    localStorage.setItem("bookings", JSON.stringify(bookings));
    return newBooking;
}

// Update booking status
function updateBookingStatus(bookingId, newStatus, additionalData = {}) {
    const bookings = getAllBookings();
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex !== -1) {
        bookings[bookingIndex].status = newStatus;
        Object.assign(bookings[bookingIndex], additionalData);
        localStorage.setItem("bookings", JSON.stringify(bookings));
        return bookings[bookingIndex];
    }
    return null;
}

// Generate unique booking ID
function generateBookingId() {
    return '#' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Calculate late charges
function calculateLateCharges(scheduledDropOff, actualDropOff) {
    const scheduled = new Date(scheduledDropOff);
    const actual = new Date(actualDropOff);
    const diffMs = actual - scheduled;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes > 30) {
        const lateSlots = Math.ceil((diffMinutes - 30) / 30);
        return lateSlots * 25;
    }
    return 0;
}

// =============================================== SCRIPT FOR RENTAL PAGE ===============================================

document.addEventListener('DOMContentLoaded', function() {
    const collectTimeSelect = document.getElementById('collect-time');
    const returnTimeSelect = document.getElementById('return-time');
    const collectDateInput = document.getElementById('collect-date');
    const returnDateInput = document.getElementById('return-date');
    const collectFromSelect = document.getElementById('collectFrom');
    const returnToSelect = document.getElementById('returnTo');
    const searchButton = document.querySelector('#rentForm button');
    const rentForm = document.getElementById('rentForm');
    const searchResults = document.querySelector('.rent-search-results');
    
    if (!collectTimeSelect || !returnTimeSelect) return;
    
    searchResults.style.display = 'none';
    searchButton.disabled = true;
    searchButton.style.opacity = '0.5';
    searchButton.style.cursor = 'not-allowed';

    function generateTimeOptions() {
        const options = [];
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < 60; j += 30) {
                const hour = i.toString().padStart(2, '0');
                const minute = j.toString().padStart(2, '0');
                const time24 = `${hour}:${minute}`;

                let hour12 = i % 12;
                if (hour12 === 0) hour12 = 12;
                const ampm = i < 12 ? 'AM' : 'PM';
                const time12 = `${hour12}:${minute} ${ampm}`;

                options.push(`<option value="${time24}">${time12}</option>`);
            }
        }
        return options.join('');
    }

    collectTimeSelect.innerHTML = generateTimeOptions();
    returnTimeSelect.innerHTML = generateTimeOptions();

    function getTodayDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getNearestTimeAhead() {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const nextSlot = Math.ceil(currentMinutes / 30) * 30;
        
        if (nextSlot >= 24 * 60) {
            return { time: '00:00', addDay: 1 };
        }
        
        const hours = Math.floor(nextSlot / 60);
        const minutes = nextSlot % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        return { time: timeString, addDay: 0 };
    }

    function addDaysToDateString(dateString, days) {
        const date = new Date(dateString);
        date.setDate(date.getDate() + days);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function addHoursToDateTime(dateString, timeString, hours) {
        const dateTime = new Date(`${dateString}T${timeString}`);
        dateTime.setHours(dateTime.getHours() + hours);
        
        const year = dateTime.getFullYear();
        const month = (dateTime.getMonth() + 1).toString().padStart(2, '0');
        const day = dateTime.getDate().toString().padStart(2, '0');
        const newDateString = `${year}-${month}-${day}`;
        
        const hour = dateTime.getHours().toString().padStart(2, '0');
        const minute = dateTime.getMinutes().toString().padStart(2, '0');
        const newTimeString = `${hour}:${minute}`;
        
        return { date: newDateString, time: newTimeString };
    }

    const todayDate = getTodayDateString();
    const nearestTime = getNearestTimeAhead();
    
    collectDateInput.min = todayDate;
    returnDateInput.min = todayDate;
    
    if (nearestTime.addDay === 1) {
        collectDateInput.value = addDaysToDateString(todayDate, 1);
    } else {
        collectDateInput.value = todayDate;
    }
    collectTimeSelect.value = nearestTime.time;
    
    const returnDateTime = addHoursToDateTime(collectDateInput.value, collectTimeSelect.value, 24);
    returnDateInput.value = returnDateTime.date;
    returnDateInput.min = collectDateInput.value;
    returnTimeSelect.value = returnDateTime.time;

    function checkFormCompletion() {
        const isComplete = 
            collectFromSelect.value !== '' &&
            returnToSelect.value !== '' &&
            collectDateInput.value !== '' &&
            collectTimeSelect.value !== '' &&
            returnDateInput.value !== '' &&
            returnTimeSelect.value !== '';
        
        if (isComplete && validateDatesAndTimes()) {
            searchButton.disabled = false;
            searchButton.style.opacity = '1';
            searchButton.style.cursor = 'pointer';
        } else {
            searchButton.disabled = true;
            searchButton.style.opacity = '0.5';
            searchButton.style.cursor = 'not-allowed';
        }
    }

    function validateDatesAndTimes() {
        const collectDateValue = collectDateInput.value;
        const returnDateValue = returnDateInput.value;
        const collectTime = collectTimeSelect.value;
        const returnTime = returnTimeSelect.value;

        returnDateInput.setCustomValidity('');
        returnTimeSelect.setCustomValidity('');

        if (collectDateValue && returnDateValue) {
            const collectDateTime = new Date(`${collectDateValue}T${collectTime}`);
            const returnDateTime = new Date(`${returnDateValue}T${returnTime}`);
            
            if (returnDateTime < collectDateTime) {
                returnTimeSelect.setCustomValidity('Return date and time cannot be earlier than collection date and time.');
                return false;
            }

            const timeDifference = returnDateTime.getTime() - collectDateTime.getTime();
            if (timeDifference > 0 && timeDifference < 30 * 60 * 1000) {
                returnTimeSelect.setCustomValidity('Return time must be at least 30 minutes after collection time.');
                return false;
            }
        }
        
        return true;
    }

    function calculateRentalHours() {
        const collectDateTime = new Date(`${collectDateInput.value}T${collectTimeSelect.value}`);
        const returnDateTime = new Date(`${returnDateInput.value}T${returnTimeSelect.value}`);
        const hours = (returnDateTime.getTime() - collectDateTime.getTime()) / (1000 * 60 * 60);
        return Math.max(hours, 0);
    }

    rentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateDatesAndTimes()) {
            const rentalHours = calculateRentalHours();
            const pricePerHour = 20;
            const totalPrice = rentalHours * pricePerHour;
            
            document.getElementById('Total Price').textContent = totalPrice.toFixed(2);
            searchResults.style.display = 'block';
            searchResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    collectFromSelect.addEventListener('change', checkFormCompletion);
    returnToSelect.addEventListener('change', checkFormCompletion);
    
    collectDateInput.addEventListener('change', () => {
        returnDateInput.min = collectDateInput.value;
        if (returnDateInput.value < collectDateInput.value) {
            const newReturn = addHoursToDateTime(collectDateInput.value, collectTimeSelect.value, 24);
            returnDateInput.value = newReturn.date;
            returnTimeSelect.value = newReturn.time;
        }
        validateDatesAndTimes();
        checkFormCompletion();
    });

    collectTimeSelect.addEventListener('change', () => {
        validateDatesAndTimes();
        checkFormCompletion();
    });

    returnDateInput.addEventListener('change', () => {
        validateDatesAndTimes();
        checkFormCompletion();
    });
    
    returnTimeSelect.addEventListener('change', () => {
        validateDatesAndTimes();
        checkFormCompletion();
    });

    checkFormCompletion();

    const bookNowButton = document.querySelector('.rent-veh-card-cta button');
    
    if (bookNowButton) {
        bookNowButton.addEventListener('click', function() {
            // Check if user is logged in
            if (!isLoggedIn()) {
                showCustomAlert('Please login to make a booking');
                toggleModal(true);
                return;
            }

            const collectLocation = collectFromSelect.options[collectFromSelect.selectedIndex].text;
            const returnLocation = returnToSelect.options[returnToSelect.selectedIndex].text;
            const collectDate = collectDateInput.value;
            const collectTime = collectTimeSelect.value;
            const returnDate = returnDateInput.value;
            const returnTime = returnTimeSelect.value;
            const rentalHours = calculateRentalHours();
            const totalPrice = document.getElementById('Total Price').textContent;
            
            function convertTo12Hour(time24) {
                const [hours, minutes] = time24.split(':');
                let hour = parseInt(hours);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                hour = hour % 12 || 12;
                return `${hour}:${minutes} ${ampm}`;
            }
            
            const modal = document.createElement('div');
            modal.className = 'booking-modal';
            modal.innerHTML = `
                <div class="booking-modal-content">
                    <span class="booking-close-btn">&times;</span>
                    <h2>Booking Summary</h2>
                    <div class="booking-summary">
                        <div class="booking-vehicle-info">
                            <h3>Polestar 2</h3>
                            <p class="vehicle-type">Sedan • 5-seater • Standard • Electric • Eco</p>
                        </div>
                        
                        <div class="booking-details">
                            <div class="booking-detail-row">
                                <span class="detail-label">Collection Location:</span>
                                <span class="detail-value">${collectLocation}</span>
                            </div>
                            <div class="booking-detail-row">
                                <span class="detail-label">Collection Date & Time:</span>
                                <span class="detail-value">${collectDate} at ${convertTo12Hour(collectTime)}</span>
                            </div>
                            <div class="booking-detail-row">
                                <span class="detail-label">Return Location:</span>
                                <span class="detail-value">${returnLocation}</span>
                            </div>
                            <div class="booking-detail-row">
                                <span class="detail-label">Return Date & Time:</span>
                                <span class="detail-value">${returnDate} at ${convertTo12Hour(returnTime)}</span>
                            </div>
                            <div class="booking-detail-row">
                                <span class="detail-label">Rental Duration:</span>
                                <span class="detail-value">${rentalHours.toFixed(1)} hours</span>
                            </div>
                        </div>
                        
                        <div class="booking-price-summary">
                            <div class="price-row">
                                <span>Rate per hour:</span>
                                <span>$20.00</span>
                            </div>
                            <div class="price-row">
                                <span>Duration:</span>
                                <span>${rentalHours.toFixed(1)} hours</span>
                            </div>
                            <div class="price-row total-price">
                                <span>Total Amount:</span>
                                <span>$${totalPrice}</span>
                            </div>
                        </div>
                        
                        <div class="payment-section">
                            <h3>Payment Details</h3>
                            <form id="paymentForm">
                                <div class="payment-form-group">
                                    <label for="cardName">Cardholder Name</label>
                                    <input type="text" id="cardName" required placeholder="John Doe">
                                </div>
                                <div class="payment-form-group">
                                    <label for="cardNumber">Card Number</label>
                                    <input type="text" id="cardNumber" required placeholder="1234 5678 9012 3456" maxlength="19">
                                </div>
                                <div class="payment-form-row">
                                    <div class="payment-form-group">
                                        <label for="expiryDate">Expiry Date</label>
                                        <input type="text" id="expiryDate" required placeholder="MM/YY" maxlength="5">
                                    </div>
                                    <div class="payment-form-group">
                                        <label for="cvv">CVV</label>
                                        <input type="text" id="cvv" required placeholder="123" maxlength="3">
                                    </div>
                                </div>
                                <button type="submit" class="pay-now-btn">Pay Now - $${totalPrice}</button>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            modal.style.display = 'flex';
            
            const closeBtn = modal.querySelector('.booking-close-btn');
            closeBtn.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
            
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
            
            const cardNumberInput = modal.querySelector('#cardNumber');
            cardNumberInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\s/g, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = formattedValue;
            });
            
            const expiryInput = modal.querySelector('#expiryDate');
            expiryInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2, 4);
                }
                e.target.value = value;
            });
            
            const cvvInput = modal.querySelector('#cvv');
            cvvInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
            
            const paymentForm = modal.querySelector('#paymentForm');
            paymentForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const payButton = paymentForm.querySelector('.pay-now-btn');
                payButton.textContent = 'Processing...';
                payButton.disabled = true;
                
                setTimeout(function() {
                    // Save booking
                    const bookingData = {
                        vehicleName: 'Polestar 2',
                        vehicleType: 'Sedan • 5-seater • Standard • Electric',
                        collectLocation: collectLocation,
                        returnLocation: returnLocation,
                        collectDate: collectDate,
                        collectTime: collectTime,
                        returnDate: returnDate,
                        returnTime: returnTime,
                        scheduledDropOff: `${returnDate}T${returnTime}`,
                        rentalHours: rentalHours,
                        paidAmount: parseFloat(totalPrice)
                    };
                    
                    addBooking(bookingData);
                    window.location.href = 'A2_ProfilePage.html';
                }, 1500);
            });
        });
    }
});

