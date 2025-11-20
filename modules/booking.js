/**
 * Booking Module
 * Shared booking logic for businesses that require appointments
 */

const db = require('../database/db');
const { sendWhatsAppMessage } = require('./generic');

/**
 * Create a new booking
 */
async function createBooking(businessId, customerId, serviceId, bookingDate, bookingTime, notes = null) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO bookings (business_id, customer_id, service_id, booking_date, booking_time, status, notes)
             VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
            [businessId, customerId, serviceId, bookingDate, bookingTime, notes],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        business_id: businessId,
                        customer_id: customerId,
                        service_id: serviceId,
                        booking_date: bookingDate,
                        booking_time: bookingTime,
                        status: 'pending',
                        notes: notes
                    });
                }
            }
        );
    });
}

/**
 * Get bookings for a business
 */
async function getBookings(businessId, filters = {}) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT b.*, c.name as customer_name, c.phone_number, s.name as service_name, s.price
            FROM bookings b
            LEFT JOIN customers c ON b.customer_id = c.id
            LEFT JOIN services s ON b.service_id = s.id
            WHERE b.business_id = ?
        `;
        const params = [businessId];

        if (filters.status) {
            query += ` AND b.status = ?`;
            params.push(filters.status);
        }

        if (filters.date) {
            query += ` AND b.booking_date = ?`;
            params.push(filters.date);
        }

        if (filters.dateFrom) {
            query += ` AND b.booking_date >= ?`;
            params.push(filters.dateFrom);
        }

        query += ` ORDER BY b.booking_date, b.booking_time`;

        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

/**
 * Get booking by ID
 */
async function getBookingById(bookingId) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT b.*, c.name as customer_name, c.phone_number, s.name as service_name, s.price
             FROM bookings b
             LEFT JOIN customers c ON b.customer_id = c.id
             LEFT JOIN services s ON b.service_id = s.id
             WHERE b.id = ?`,
            [bookingId],
            (err, row) => {
                if (err) reject(err);
                else resolve(row);
            }
        );
    });
}

/**
 * Update booking status
 */
async function updateBookingStatus(bookingId, status) {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE bookings SET status = ? WHERE id = ?`,
            [status, bookingId],
            function(err) {
                if (err) reject(err);
                else resolve({ success: true, changes: this.changes });
            }
        );
    });
}

/**
 * Cancel booking
 */
async function cancelBooking(bookingId) {
    return updateBookingStatus(bookingId, 'cancelled');
}

/**
 * Confirm booking
 */
async function confirmBooking(bookingId) {
    return updateBookingStatus(bookingId, 'confirmed');
}

/**
 * Check if time slot is available
 */
async function isTimeSlotAvailable(businessId, bookingDate, bookingTime) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT COUNT(*) as count FROM bookings
             WHERE business_id = ? AND booking_date = ? AND booking_time = ? AND status IN ('pending', 'confirmed')`,
            [businessId, bookingDate, bookingTime],
            (err, row) => {
                if (err) reject(err);
                else resolve(row.count === 0);
            }
        );
    });
}

/**
 * Get available time slots for a date
 */
async function getAvailableTimeSlots(businessId, bookingDate, businessHours = null) {
    // Default time slots (30-minute intervals)
    const defaultSlots = [];
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            defaultSlots.push(timeStr);
        }
    }

    // Check which slots are available
    const availableSlots = [];
    for (const slot of defaultSlots) {
        const isAvailable = await isTimeSlotAvailable(businessId, bookingDate, slot);
        if (isAvailable) {
            availableSlots.push(slot);
        }
    }

    return availableSlots;
}

/**
 * Send booking confirmation message
 */
async function sendBookingConfirmation(booking, business, customer) {
    const message = `✅ Booking Confirmed!\n\n` +
        `Service: ${booking.service_name}\n` +
        `Date: ${booking.booking_date}\n` +
        `Time: ${booking.booking_time}\n` +
        `Status: ${booking.status}\n\n` +
        `We'll send you a reminder before your appointment.`;

    return await sendWhatsAppMessage(customer.phone_number, message, business.id);
}

/**
 * Send booking reminder
 */
async function sendBookingReminder(booking, business, customer) {
    const message = `🔔 Reminder: You have an appointment tomorrow!\n\n` +
        `Service: ${booking.service_name}\n` +
        `Date: ${booking.booking_date}\n` +
        `Time: ${booking.booking_time}\n\n` +
        `See you soon!`;

    return await sendWhatsAppMessage(customer.phone_number, message, business.id);
}

module.exports = {
    createBooking,
    getBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking,
    confirmBooking,
    isTimeSlotAvailable,
    getAvailableTimeSlots,
    sendBookingConfirmation,
    sendBookingReminder
};

