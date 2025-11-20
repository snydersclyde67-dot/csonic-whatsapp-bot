/**
 * Booking Service
 * High-level booking management functions
 */

const { getBookings, createBooking, updateBookingStatus, sendBookingReminder } = require('../modules/booking');
const { getBusinessInfo } = require('../modules/generic');

/**
 * Get all bookings with filters
 */
async function getAllBookings(filters = {}) {
    if (filters.businessId) {
        return await getBookings(filters.businessId, filters);
    }
    
    // If no business filter, get all businesses' bookings
    const db = require('../database/db');
    let query = `
        SELECT b.*, bus.name as business_name, c.name as customer_name, c.phone_number, s.name as service_name
        FROM bookings b
        LEFT JOIN businesses bus ON b.business_id = bus.id
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN services s ON b.service_id = s.id
        WHERE 1=1
    `;
    const params = [];

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

    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

/**
 * Send reminders for tomorrow's bookings
 */
async function sendTomorrowReminders() {
    const db = require('../database/db');
    const { getOrCreateCustomer } = require('../modules/generic');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const bookings = await new Promise((resolve, reject) => {
        db.all(
            `SELECT b.*, bus.name as business_name, c.name as customer_name, c.phone_number, s.name as service_name
             FROM bookings b
             LEFT JOIN businesses bus ON b.business_id = bus.id
             LEFT JOIN customers c ON b.customer_id = c.id
             LEFT JOIN services s ON b.service_id = s.id
             WHERE b.booking_date = ? AND b.status IN ('pending', 'confirmed')`,
            [tomorrowStr],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });

    const results = [];
    for (const booking of bookings) {
        try {
            const business = await getBusinessInfo(booking.business_id);
            const customer = {
                id: booking.customer_id,
                name: booking.customer_name,
                phone_number: booking.phone_number
            };
            
            await sendBookingReminder(booking, business, customer);
            results.push({ bookingId: booking.id, success: true });
        } catch (error) {
            console.error(`Error sending reminder for booking ${booking.id}:`, error);
            results.push({ bookingId: booking.id, success: false, error: error.message });
        }
    }

    return results;
}

/**
 * Get booking statistics
 */
async function getBookingStats(businessId, period = 'month') {
    const db = require('../database/db');
    
    let dateFilter = '';
    const params = [businessId];

    if (period === 'week') {
        dateFilter = ` AND booking_date >= date('now', '-7 days')`;
    } else if (period === 'month') {
        dateFilter = ` AND booking_date >= date('now', '-30 days')`;
    } else if (period === 'year') {
        dateFilter = ` AND booking_date >= date('now', '-365 days')`;
    }

    const stats = await new Promise((resolve, reject) => {
        db.get(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
             FROM bookings
             WHERE business_id = ? ${dateFilter}`,
            params,
            (err, row) => {
                if (err) reject(err);
                else resolve(row || {});
            }
        );
    });

    return stats;
}

module.exports = {
    getAllBookings,
    sendTomorrowReminders,
    getBookingStats
};

