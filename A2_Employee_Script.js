// Employee Page Script
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is an employee
    if (!localStorage.getItem("loggedIn") || localStorage.getItem("loggedIn") !== "true") {
        window.location.href = 'index.html';
        return;
    }

    const username = localStorage.getItem("username");
    if (!username.startsWith("AZEmp")) {
        window.location.href = 'index.html';
        return;
    }

    // Set employee info
    document.getElementById('empId').textContent = username;
    document.getElementById('empName').textContent = 'Benjamin';
    document.getElementById('empEmail').textContent = `${username.toLowerCase()}@azoom.com`;

    const empname = 'Benjamin';

    const locationSelect = document.getElementById('locationSelect');
    const bookingsContainer = document.getElementById('bookingsContainer');

    locationSelect.addEventListener('change', function() {
        const selectedLocation = this.value;
        if (selectedLocation) {
            displayBookingsByLocation(selectedLocation);
        } else {
            bookingsContainer.innerHTML = '<p class="no-selection-message">Please select a location to view bookings</p>';
        }
    });

    function displayBookingsByLocation(location) {
        const bookings = getBookingsByLocation(location);
        
        if (bookings.length === 0) {
            bookingsContainer.innerHTML = '<p>No bookings found for this location</p>';
            return;
        }

        // Group bookings by status
        const statusGroups = {
            'Booked': [],
            'Collected': [],
            'Returned, Pending Review': [],
            'Pending Closing Payments': [],
            'Closed': []
        };

        bookings.forEach(booking => {
            if (statusGroups[booking.status]) {
                statusGroups[booking.status].push(booking);
            }
        });

        let html = '';
        
        // Display each status group
        Object.keys(statusGroups).forEach(status => {
            const bookingsInStatus = statusGroups[status];
            
            html += `
                <div class="status-section">
                    <h3 class="status-header">${status} (${bookingsInStatus.length})</h3>
                    <div class="status-bookings">
            `;

            if (bookingsInStatus.length === 0) {
                html += '<p class="empty-status">No bookings in this status</p>';
            } else {
                bookingsInStatus.forEach(booking => {
                    html += createEmployeeBookingCard(booking);
                });
            }

            html += `
                    </div>
                </div>
            `;
        });

        bookingsContainer.innerHTML = html;

        // Add event listeners to review buttons
        document.querySelectorAll('.review-car-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = this.dataset.bookingId;
                showReviewModal(bookingId);
            });
        });
    }

    function createEmployeeBookingCard(booking) {
        const collectDateTime = formatDateTime(booking.collectDate, booking.collectTime);
        const returnDateTime = formatDateTime(booking.returnDate, booking.returnTime);
        const actualDropOffDisplay = booking.actualDropOff ? 
            formatDateTime(booking.actualDropOff.split('T')[0], booking.actualDropOff.split('T')[1].substring(0,5)) : 
            'N/A';

        let actionButton = '';
        if (booking.status === 'Returned, Pending Review') {
            actionButton = `<button class="review-car-btn" data-booking-id="${booking.id}">Review Car</button>`;
        }

        return `
            <div class="emp-booking-card">
                <div class="emp-booking-header">
                    <h4>${booking.vehicleName} - ${booking.id}</h4>
                    <span class="booking-customer">Customer: ${booking.username}</span>
                </div>
                <div class="emp-booking-details">
                    <p><strong>Pick-up:</strong> ${collectDateTime}</p>
                    <p><strong>Scheduled Drop-off:</strong> ${returnDateTime}</p>
                    <p><strong>Actual Drop-off:</strong> ${actualDropOffDisplay}</p>
                    <p><strong>Amount Paid:</strong> $${booking.paidAmount.toFixed(2)}</p>
                    ${booking.additionalCharges > 0 ? `<p><strong>Additional Charges:</strong> $${booking.additionalCharges.toFixed(2)}</p>` : ''}
                </div>
                ${actionButton}
            </div>
        `;
    }

    function formatDateTime(date, time) {
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${date} at ${hour}:${minutes} ${ampm}`;
    }

    function showReviewModal(bookingId) {
        const bookings = getAllBookings();
        const booking = bookings.find(b => b.id === bookingId);
        
        if (!booking) return;

        const modal = document.createElement('div');
        modal.className = 'booking-modal review-modal';
        modal.innerHTML = `
            <div class="booking-modal-content" style="max-width: 700px;">
                <span class="booking-close-btn">&times;</span>
                <h2>Vehicle Return Review - ${booking.id}</h2>
                <div class="booking-summary">
                    <form id="reviewForm">
                        <!-- Customer Information -->
                        <div class="review-section">
                            <h3>Customer Information</h3>
                            <p><strong>Name:</strong> ${booking.username}</p>
                            <p><strong>Booking ID:</strong> ${booking.id}</p>
                        </div>

                        <!-- Employee Information -->
                        <div class="review-section">
                            <h3>Employee Information</h3>
                            <p><strong>Reviewed By:</strong> ${empname}</p>
                            <p><strong>Review Date:</strong> ${new Date().toLocaleDateString()}</p>
                        </div>

                        <!-- Car Information -->
                        <div class="review-section">
                            <h3>Vehicle Information</h3>
                            <p><strong>Vehicle:</strong> ${booking.vehicleName}</p>
                            <p><strong>Type:</strong> ${booking.vehicleType}</p>
                            <p><strong>Scheduled Return:</strong> ${formatDateTime(booking.returnDate, booking.returnTime)}</p>
                            <p><strong>Actual Return:</strong> ${booking.actualDropOff ? formatDateTime(booking.actualDropOff.split('T')[0], booking.actualDropOff.split('T')[1].substring(0,5)) : 'Not set'}</p>
                        </div>

                        <!-- Override Return Date & Time -->
                        <div class="review-section">
                            <h3>Override Return Date & Time (if needed)</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="overrideDate">Date:</label>
                                    <input type="date" id="overrideDate" value="${booking.actualDropOff ? booking.actualDropOff.split('T')[0] : booking.returnDate}">
                                </div>
                                <div class="form-group">
                                    <label for="overrideTime">Time:</label>
                                    <input type="time" id="overrideTime" value="${booking.actualDropOff ? booking.actualDropOff.split('T')[1].substring(0,5) : booking.returnTime}">
                                </div>
                            </div>
                        </div>

                        <!-- Damage Assessment -->
                        <div class="review-section">
                            <h3>Damage Assessment</h3>
                            <div class="form-group">
                                <label for="damageNotes">Damage Notes:</label>
                                <textarea id="damageNotes" rows="4" placeholder="Describe any damages found..."></textarea>
                            </div>
                            <div class="form-group">
                                <label for="damageImages">Attach Images (simulated):</label>
                                <input type="file" id="damageImages" multiple accept="image/*">
                                <p class="help-text">Note: Image upload is simulated for this demo</p>
                            </div>
                        </div>

                        <!-- Additional Charges -->
                        <div class="review-section">
                            <h3>Charges Calculation</h3>
                            <div class="charges-display">
                                <p><strong>Late Return Charges:</strong> $<span id="lateCharges">0.00</span></p>
                                <div class="form-group">
                                    <label for="damageCharges">Damage Charges ($):</label>
                                    <input type="number" id="damageCharges" min="0" step="0.01" value="0" placeholder="0.00">
                                </div>
                                <p class="total-charges"><strong>Total Additional Charges:</strong> $<span id="totalCharges">0.00</span></p>
                            </div>
                        </div>

                        <button type="submit" class="pay-now-btn">Submit Review</button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Calculate late charges
        const overrideDateInput = modal.querySelector('#overrideDate');
        const overrideTimeInput = modal.querySelector('#overrideTime');
        const damageChargesInput = modal.querySelector('#damageCharges');
        const lateChargesSpan = modal.querySelector('#lateCharges');
        const totalChargesSpan = modal.querySelector('#totalCharges');

        function updateCharges() {
            const actualDropOff = `${overrideDateInput.value}T${overrideTimeInput.value}`;
            const lateCharges = calculateLateCharges(booking.scheduledDropOff, actualDropOff);
            const damageCharges = parseFloat(damageChargesInput.value) || 0;
            const total = lateCharges + damageCharges;
            
            lateChargesSpan.textContent = lateCharges.toFixed(2);
            totalChargesSpan.textContent = total.toFixed(2);
        }

        overrideDateInput.addEventListener('change', updateCharges);
        overrideTimeInput.addEventListener('change', updateCharges);
        damageChargesInput.addEventListener('input', updateCharges);

        // Initial calculation
        updateCharges();

        const closeBtn = modal.querySelector('.booking-close-btn');
        closeBtn.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        const reviewForm = modal.querySelector('#reviewForm');
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const actualDropOff = `${overrideDateInput.value}T${overrideTimeInput.value}`;
            const lateCharges = calculateLateCharges(booking.scheduledDropOff, actualDropOff);
            const damageCharges = parseFloat(damageChargesInput.value) || 0;
            const totalAdditionalCharges = lateCharges + damageCharges;
            const damageNotes = modal.querySelector('#damageNotes').value;
            const damageImagesInput = modal.querySelector('#damageImages');
            
            // Simulate image file names
            const imageFiles = Array.from(damageImagesInput.files).map(f => f.name);

            const reviewData = {
                customerName: booking.username,
                employeeName: empname,
                actualReturnDateTime: formatDateTime(overrideDateInput.value, overrideTimeInput.value),
                damageNotes: damageNotes,
                damageImages: imageFiles,
                lateCharges: lateCharges,
                damageCharges: damageCharges
            };

            // Determine new status
            const newStatus = totalAdditionalCharges > 0 ? 'Pending Closing Payments' : 'Closed';

            updateBookingStatus(bookingId, newStatus, {
                actualDropOff: actualDropOff,
                additionalCharges: totalAdditionalCharges,
                reviewData: reviewData
            });

            document.body.removeChild(modal);
            showCustomAlert(`Review submitted successfully! Status: ${newStatus}`);
            
            // Refresh the bookings display
            if (locationSelect.value) {
                displayBookingsByLocation(locationSelect.value);
            }
        });
    }
});