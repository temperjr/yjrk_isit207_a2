function showCustomConfirm(message, onConfirm) {
  const confirmBox = document.getElementById('custom-confirm-box');
  const confirmMessage = document.getElementById('custom-confirm-message');
  const confirmYes = document.getElementById('confirm-yes');
  const confirmNo = document.getElementById('confirm-no');
  const closeBtn = document.getElementById('custom-confirm-close');

  confirmMessage.textContent = message;
  confirmBox.style.display = 'flex'; // Show modal

  // Cleanup previous event listeners
  confirmYes.onclick = null;
  confirmNo.onclick = null;
  closeBtn.onclick = null;

  confirmYes.onclick = function() {
    confirmBox.style.display = 'none';
    onConfirm(true);
  };

  confirmNo.onclick = function() {
    confirmBox.style.display = 'none';
    onConfirm(false);
  };

  closeBtn.onclick = function() {
    confirmBox.style.display = 'none';
    onConfirm(false);
  };
}


// Profile Page Script
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!localStorage.getItem("loggedIn") || localStorage.getItem("loggedIn") !== "true") {
        window.location.href = 'index.html';
        return;
    }

    const username = localStorage.getItem("username");
    const currentBookingsSection = document.querySelector('.current-bookings');
    const pastBookingsSection = document.querySelector('.past-bookings');

    // Load user bookings
    loadUserBookings();

    function loadUserBookings() {
        const bookings = getUserBookings(username);
        
        // Clear existing bookings (remove static examples)
        const existingCurrentBookings = currentBookingsSection.querySelectorAll('.booking-entry');
        existingCurrentBookings.forEach(booking => booking.remove());
        
        const existingPastBookings = pastBookingsSection.querySelectorAll('.booking-entry');
        existingPastBookings.forEach(booking => booking.remove());

        // Separate current and past bookings
        const currentBookings = bookings.filter(b => b.status !== 'Closed');
        const pastBookings = bookings.filter(b => b.status === 'Closed');

        // Display current bookings
        if (currentBookings.length === 0) {
            const noBookings = document.createElement('p');
            noBookings.textContent = 'No current bookings';
            noBookings.style.textAlign = 'center';
            noBookings.style.padding = '20px';
            noBookings.style.color = '#999';
            currentBookingsSection.appendChild(noBookings);
        } else {
            currentBookings.forEach(booking => {
                currentBookingsSection.appendChild(createBookingCard(booking, false));
            });
        }

        // Display past bookings
        if (pastBookings.length === 0) {
            const noBookings = document.createElement('p');
            noBookings.textContent = 'No past bookings';
            noBookings.style.textAlign = 'center';
            noBookings.style.padding = '20px';
            noBookings.style.color = '#999';
            pastBookingsSection.appendChild(noBookings);
        } else {
            pastBookings.forEach(booking => {
                pastBookingsSection.appendChild(createBookingCard(booking, true));
            });
        }
    }

    function createBookingCard(booking, isPast) {
        const div = document.createElement('div');
        div.className = 'booking-entry' + (isPast ? ' completed' : '');
        
        const collectDateTime = formatDateTime(booking.collectDate, booking.collectTime);
        const returnDateTime = formatDateTime(booking.returnDate, booking.returnTime);
        const actualDropOffDisplay = booking.actualDropOff ? 
            formatDateTime(booking.actualDropOff.split('T')[0], booking.actualDropOff.split('T')[1].substring(0,5)) : 
            'N/A';

        let actionButtons = '';
        
        if (!isPast) {
            if (booking.status === 'Booked') {
                actionButtons = `
                    <button class="cancel-booking-button" data-booking-id="${booking.id}">Cancel Booking</button>
                    <button class="collect-car-button" data-booking-id="${booking.id}">Collect Car</button>
                `;
            } else if (booking.status === 'Collected') {
                actionButtons = `
                    <button class="return-car-button" data-booking-id="${booking.id}">Return Car</button>
                `;
            } else if (booking.status === 'Returned, Pending Review') {
                actionButtons = '<p><em>Awaiting employee review</em></p>';
            } else if (booking.status === 'Pending Closing Payments') {
                actionButtons = `
                    <button class="pay-additional-btn" data-booking-id="${booking.id}">Pay Additional Charges</button>
                `;
            }
        } else {
            actionButtons = `
                <button class="view-return-form-button" data-booking-id="${booking.id}">View Return Form</button>
            `;
        }

        div.innerHTML = `
            <h3>${booking.vehicleName}</h3>
            <div class="booking-card-details-container">
                <div class="curr-booking-details">
                    <p><strong>Booking ID:</strong> ${booking.id}</p>
                    <p><strong>Collection Location:</strong> ${booking.collectLocation}</p>
                    <p><strong>Pick-up:</strong> ${collectDateTime}</p>
                    <p><strong>Return Location:</strong> ${booking.returnLocation}</p>
                    <p><strong>Drop-off:</strong> ${returnDateTime}</p>
                    <p><strong>Actual Drop-off:</strong> <span class="actual-drop-off-time">${actualDropOffDisplay}</span></p>
                </div>
                <div class="curr-booking-action-div">
                    <p><strong>Status:</strong> <span class="curr-booking-status">${booking.status}</span></p>
                    <p><strong>Paid Amount:</strong> <span>$${booking.paidAmount.toFixed(2)}</span></p>
                    ${booking.additionalCharges > 0 ? `<p><strong>Additional Charges:</strong> $${booking.additionalCharges.toFixed(2)}</p>` : ''}
                    ${booking.additionalCharges > 0 && isPast ? `<p><strong>Total Amount:</strong> $${(booking.paidAmount + booking.additionalCharges).toFixed(2)}</p>` : ''}
                    ${actionButtons}
                </div>
            </div>
        `;

        // Add event listeners to buttons
        const cancelBtn = div.querySelector('.cancel-booking-button');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                handleCancelBooking(booking.id);
            });
        }

        const collectBtn = div.querySelector('.collect-car-button');
        if (collectBtn) {
            collectBtn.addEventListener('click', function() {
                handleCollectCar(booking.id);
            });
        }

        const returnBtn = div.querySelector('.return-car-button');
        if (returnBtn) {
            returnBtn.addEventListener('click', function() {
                handleReturnCar(booking.id);
            });
        }

        const payAdditionalBtn = div.querySelector('.pay-additional-btn');
        if (payAdditionalBtn) {
            payAdditionalBtn.addEventListener('click', function() {
                handlePayAdditional(booking.id);
            });
        }

        const viewReturnBtn = div.querySelector('.view-return-form-button');
        if (viewReturnBtn) {
            viewReturnBtn.addEventListener('click', function() {
                handleViewReturnForm(booking.id);
            });
        }

        return div;
    }

    function formatDateTime(date, time) {
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${date} at ${hour}:${minutes} ${ampm}`;
    }

    function handleCancelBooking(bookingId) {
        showCustomConfirm('Are you sure you want to cancel this booking?', function(confirmed) {
            if (confirmed) {
                const bookings = getAllBookings();
                const filteredBookings = bookings.filter(b => b.id !== bookingId);
                localStorage.setItem('bookings', JSON.stringify(filteredBookings));
                loadUserBookings();
                showCustomAlert('Booking cancelled successfully');
            }
        });
    }

    function handleCollectCar(bookingId) {
        showCustomConfirm('Confirm vehicle collection?', function(confirmed) {
            if (confirmed) {
                updateBookingStatus(bookingId, 'Collected');
                loadUserBookings();
                showCustomAlert('Vehicle collected successfully!');
            }
        });
    }

    function handleReturnCar(bookingId) {
        showCustomConfirm('Confirm return of vehicle?', function(confirmed) {
            if (confirmed) {
                const now = new Date();
                const actualDropOff = now.toLocaleString('sv-SE').replace(' ', 'T');
            
                updateBookingStatus(bookingId, 'Returned, Pending Review', {
                    actualDropOff: actualDropOff
                });
                
                loadUserBookings();
                showCustomAlert('Vehicle marked as returned. Awaiting employee review.');
            }
        });
    }    

    function validateCardNumber(number) {
        // Remove spaces
        const cleaned = number.replace(/\s/g, '');
        // Check if 16 digits
        if (!/^\d{16}$/.test(cleaned)) {
            return false;
        }
        return true;
    }

    function validateExpiryDate(expiry) {
        const cleaned = expiry.replace(/\D/g, '');
        if (cleaned.length !== 4) return false;
        
        const month = parseInt(cleaned.substring(0, 2));
        const year = parseInt('20' + cleaned.substring(2, 4));
        
        if (month < 1 || month > 12) return false;
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;
        
        return true;
    }

    function validateCVV(cvv) {
        return /^\d{3}$/.test(cvv);
    }

    function handlePayAdditional(bookingId) {
        const bookings = getAllBookings();
        const booking = bookings.find(b => b.id === bookingId);
        
        if (!booking) return;

        // Create payment modal
        const modal = document.createElement('div');
        modal.className = 'booking-modal';
        modal.innerHTML = `
            <div class="booking-modal-content">
                <span class="booking-close-btn">&times;</span>
                <h2>Pay Additional Charges</h2>
                <div class="booking-summary">
                    <div class="booking-price-summary">
                        <div class="price-row">
                            <span>Original Amount:</span>
                            <span>$${booking.paidAmount.toFixed(2)}</span>
                        </div>
                        <div class="price-row">
                            <span>Additional Charges:</span>
                            <span>$${booking.additionalCharges.toFixed(2)}</span>
                        </div>
                        <div class="price-row total-price">
                            <span>Amount Due:</span>
                            <span>$${booking.additionalCharges.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="payment-section">
                        <h3>Payment Details</h3>
                        <form id="additionalPaymentForm">
                            <div class="payment-form-group">
                                <label for="cardName">Cardholder Name</label>
                                <input type="text" id="cardName" required placeholder="John Doe">
                                <span class="error-message" id="cardNameError"></span>
                            </div>
                            <div class="payment-form-group">
                                <label for="cardNumber">Card Number</label>
                                <input type="text" id="cardNumber" required placeholder="1234 5678 9012 3456" maxlength="19">
                                <span class="error-message" id="cardNumberError"></span>
                            </div>
                            <div class="payment-form-row">
                                <div class="payment-form-group">
                                    <label for="expiryDate">Expiry Date</label>
                                    <input type="text" id="expiryDate" required placeholder="MM/YY" maxlength="5">
                                    <span class="error-message" id="expiryError"></span>
                                </div>
                                <div class="payment-form-group">
                                    <label for="cvv">CVV</label>
                                    <input type="text" id="cvv" required placeholder="123" maxlength="3">
                                    <span class="error-message" id="cvvError"></span>
                                </div>
                            </div>
                            <button type="submit" class="pay-now-btn">Pay $${booking.additionalCharges.toFixed(2)}</button>
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

        // Form validation
        const cardNameInput = modal.querySelector('#cardName');
        const cardNumberInput = modal.querySelector('#cardNumber');
        const expiryInput = modal.querySelector('#expiryDate');
        const cvvInput = modal.querySelector('#cvv');

        cardNameInput.addEventListener('blur', function() {
            const error = modal.querySelector('#cardNameError');
            if (this.value.trim().length < 3) {
                error.textContent = 'Please enter a valid name';
                error.style.display = 'block';
            } else {
                error.style.display = 'none';
            }
        });

        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });

        cardNumberInput.addEventListener('blur', function() {
            const error = modal.querySelector('#cardNumberError');
            if (!validateCardNumber(this.value)) {
                error.textContent = 'Please enter a valid 16-digit card number';
                error.style.display = 'block';
            } else {
                error.style.display = 'none';
            }
        });

        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
        });

        expiryInput.addEventListener('blur', function() {
            const error = modal.querySelector('#expiryError');
            if (!validateExpiryDate(this.value)) {
                error.textContent = 'Invalid or expired date';
                error.style.display = 'block';
            } else {
                error.style.display = 'none';
            }
        });

        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });

        cvvInput.addEventListener('blur', function() {
            const error = modal.querySelector('#cvvError');
            if (!validateCVV(this.value)) {
                error.textContent = 'CVV must be 3 digits';
                error.style.display = 'block';
            } else {
                error.style.display = 'none';
            }
        });

        const paymentForm = modal.querySelector('#additionalPaymentForm');
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate all fields
            const isNameValid = cardNameInput.value.trim().length >= 3;
            const isCardValid = validateCardNumber(cardNumberInput.value);
            const isExpiryValid = validateExpiryDate(expiryInput.value);
            const isCVVValid = validateCVV(cvvInput.value);

            if (!isNameValid) {
                modal.querySelector('#cardNameError').textContent = 'Please enter a valid name';
                modal.querySelector('#cardNameError').style.display = 'block';
            }
            if (!isCardValid) {
                modal.querySelector('#cardNumberError').textContent = 'Please enter a valid 16-digit card number';
                modal.querySelector('#cardNumberError').style.display = 'block';
            }
            if (!isExpiryValid) {
                modal.querySelector('#expiryError').textContent = 'Invalid or expired date';
                modal.querySelector('#expiryError').style.display = 'block';
            }
            if (!isCVVValid) {
                modal.querySelector('#cvvError').textContent = 'CVV must be 3 digits';
                modal.querySelector('#cvvError').style.display = 'block';
            }

            if (!isNameValid || !isCardValid || !isExpiryValid || !isCVVValid) {
                return;
            }
            
            const payButton = paymentForm.querySelector('.pay-now-btn');
            payButton.textContent = 'Processing...';
            payButton.disabled = true;
            
            setTimeout(function() {
                updateBookingStatus(bookingId, 'Closed');
                document.body.removeChild(modal);
                loadUserBookings();
                showCustomAlert('Payment successful! Booking is now closed.');
            }, 1500);
        });
    }

    function handleViewReturnForm(bookingId) {
        const bookings = getAllBookings();
        const booking = bookings.find(b => b.id === bookingId);
        
        if (!booking || !booking.reviewData) {
            showCustomAlert('No return form data available');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'booking-modal';
        modal.innerHTML = `
            <div class="booking-modal-content">
                <span class="booking-close-btn">&times;</span>
                <h2>Return Form - ${booking.id}</h2>
                <div class="booking-summary">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> ${booking.reviewData.customerName}</p>
                    
                    <h3>Employee Information</h3>
                    <p><strong>Reviewed By:</strong> ${booking.reviewData.employeeName}</p>
                    
                    <h3>Vehicle Information</h3>
                    <p><strong>Vehicle:</strong> ${booking.vehicleName}</p>
                    <p><strong>Return Date & Time:</strong> ${booking.reviewData.actualReturnDateTime}</p>
                    
                    <h3>Review Notes</h3>
                    <p>${booking.reviewData.damageNotes || 'No damages reported'}</p>
                    
                    ${booking.reviewData.damageImages && booking.reviewData.damageImages.length > 0 ? `
                        <h3>Damage Images</h3>
                        <div class="damage-images">
                            ${booking.reviewData.damageImages.map(img => `<p>Image: ${img}</p>`).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="booking-price-summary" style="margin-top: 20px;">
                        <div class="price-row">
                            <span>Late Return Charges:</span>
                            <span>$${booking.reviewData.lateCharges.toFixed(2)}</span>
                        </div>
                        <div class="price-row">
                            <span>Damage Charges:</span>
                            <span>$${booking.reviewData.damageCharges.toFixed(2)}</span>
                        </div>
                        <div class="price-row total-price">
                            <span>Total Additional Charges:</span>
                            <span>$${booking.additionalCharges.toFixed(2)}</span>
                        </div>
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
    }
});