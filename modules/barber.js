/**
 * Barber Module
 * Barber shop specific features and message handling
 */

const db = require('../database/db');
const { getOperatingHours, sendWhatsAppMessage } = require('./generic');
const { createBooking, getAvailableTimeSlots } = require('./booking');

/**
 * Get services for barber shop
 */
async function getServices(businessId) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM services WHERE business_id = ? ORDER BY price`,
            [businessId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });
}

/**
 * Format services list as message
 */
function formatServicesList(services, language = 'en') {
    const messages = {
        en: {
            title: '✂️ Our Services:',
            duration: 'Duration:',
            price: 'Price: R'
        },
        af: {
            title: '✂️ Ons Dienste:',
            duration: 'Duur:',
            price: 'Prys: R'
        },
        xh: {
            title: '✂️ Iinkonzo Zethu:',
            duration: 'Ixesha:',
            price: 'Imali: R'
        },
        zu: {
            title: '✂️ Isevisi Zethu:',
            duration: 'Isikhathi:',
            price: 'Inani: R'
        },
        st: {
            title: '✂️ Litšebeletso tsa Rona:',
            duration: 'Nako:',
            price: 'Theko: R'
        }
    };

    const msg = messages[language] || messages.en;
    let response = msg.title + '\n\n';

    services.forEach((service, index) => {
        response += `${index + 1}. *${service.name}*\n`;
        if (service.description) {
            response += `   ${service.description}\n`;
        }
        response += `   ${msg.price}${service.price.toFixed(2)}\n`;
        if (service.duration) {
            response += `   ${msg.duration} ${service.duration} min\n`;
        }
        response += '\n';
    });

    response += '\nTo book, reply "book [service name] [date] [time]"';
    response += '\nExample: "book haircut 2024-01-15 10:00"';

    return response;
}

/**
 * Handle barber-specific messages
 */
async function handleMessage(business, customer, messageText) {
    const text = messageText.toLowerCase().trim();
    const language = customer.language || business.language || 'en';

    // Get services
    if (text.includes('service') || text.includes('menu') || text.includes('price') || text.includes('list')) {
        const services = await getServices(business.id);
        return formatServicesList(services, language);
    }

    // Get hours
    if (text.includes('hour') || text.includes('open') || text.includes('close') || text.includes('time')) {
        return getOperatingHours(business);
    }

    // Booking
    if (text.startsWith('book') || text.includes('appointment') || text.includes('schedule')) {
        return await handleBookingRequest(business, customer, messageText, language);
    }

    // Cancel booking
    if (text.includes('cancel') || text.includes('reschedule')) {
        return await handleCancelBooking(business, customer, messageText, language);
    }

    // View bookings
    if (text.includes('my booking') || text.includes('my appointment')) {
        return await handleViewBookings(business, customer, language);
    }

    return null; // Let AI service handle if no match
}

/**
 * Handle booking request
 */
async function handleBookingRequest(business, customer, messageText, language) {
    const services = await getServices(business.id);
    
    // Simple parsing - in production, use NLP
    const parts = messageText.toLowerCase().split(' ');
    let serviceName = null;
    let date = null;
    let time = null;

    // Find service name
    for (const service of services) {
        if (messageText.toLowerCase().includes(service.name.toLowerCase())) {
            serviceName = service.name;
            break;
        }
    }

    // Find date (YYYY-MM-DD format or relative)
    const dateMatch = messageText.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
        date = dateMatch[0];
    } else if (messageText.includes('today')) {
        date = new Date().toISOString().split('T')[0];
    } else if (messageText.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        date = tomorrow.toISOString().split('T')[0];
    }

    // Find time (HH:MM format)
    const timeMatch = messageText.match(/\d{1,2}:\d{2}/);
    if (timeMatch) {
        time = timeMatch[0];
        if (!time.includes(':')) {
            time = time.padStart(5, '0');
        }
    }

    if (!serviceName || !date || !time) {
        const messages = {
            en: 'To book, please provide:\n• Service name\n• Date (YYYY-MM-DD)\n• Time (HH:MM)\n\nExample: "book haircut 2024-01-15 10:00"\n\nOr reply "services" to see available services.',
            af: 'Om te bespreek, verskaf asseblief:\n• Diens naam\n• Datum (YYYY-MM-DD)\n• Tyd (HH:MM)\n\nVoorbeeld: "book haircut 2024-01-15 10:00"',
            xh: 'Ukubhukisha, nceda nike:\n• Igama lenkonzo\n• Umhla (YYYY-MM-DD)\n• Ixesha (HH:MM)',
            zu: 'Ukubhukha, sicela unikeze:\n• Igama lensevisi\n• Usuku (YYYY-MM-DD)\n• Isikhathi (HH:MM)',
            st: 'Ho buka, ka kopo fana ka:\n• Lebitso la tšebeletso\n• Letsatsi (YYYY-MM-DD)\n• Nako (HH:MM)'
        };
        return messages[language] || messages.en;
    }

    // Find service ID
    const service = services.find(s => s.name.toLowerCase() === serviceName.toLowerCase());
    if (!service) {
        return 'Service not found. Reply "services" to see available services.';
    }

    // Check if time slot is available
    const availableSlots = await getAvailableTimeSlots(business.id, date);
    if (!availableSlots.includes(time)) {
        return `Time slot ${time} is not available.\n\nAvailable times for ${date}:\n${availableSlots.slice(0, 10).join(', ')}`;
    }

    try {
        const booking = await createBooking(business.id, customer.id, service.id, date, time);
        
        // Send confirmation
        const confirmation = `✅ Booking Created!\n\n` +
            `Service: ${service.name}\n` +
            `Date: ${date}\n` +
            `Time: ${time}\n` +
            `Price: R${service.price.toFixed(2)}\n\n` +
            `We'll send you a reminder before your appointment.`;

        await sendWhatsAppMessage(customer.phone_number, confirmation, business.id);

        return confirmation;
    } catch (error) {
        console.error('Error creating booking:', error);
        return 'Sorry, there was an error creating your booking. Please try again or contact us directly.';
    }
}

/**
 * Handle cancel booking
 */
async function handleCancelBooking(business, customer, messageText, language) {
    // Get customer's bookings
    const db = require('../database/db');
    const bookings = await new Promise((resolve, reject) => {
        db.all(
            `SELECT b.*, s.name as service_name FROM bookings b
             LEFT JOIN services s ON b.service_id = s.id
             WHERE b.customer_id = ? AND b.business_id = ? AND b.status IN ('pending', 'confirmed')
             ORDER BY b.booking_date, b.booking_time`,
            [customer.id, business.id],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });

    if (bookings.length === 0) {
        return 'You have no active bookings to cancel.';
    }

    // Try to find booking ID in message
    const idMatch = messageText.match(/#?(\d+)/);
    if (idMatch && bookings.find(b => b.id === parseInt(idMatch[1]))) {
        const bookingId = parseInt(idMatch[1]);
        const { updateBookingStatus } = require('./booking');
        await updateBookingStatus(bookingId, 'cancelled');
        return '✅ Your booking has been cancelled.';
    }

    // Show bookings and ask which to cancel
    let response = 'Your active bookings:\n\n';
    bookings.forEach(booking => {
        response += `#${booking.id} - ${booking.service_name}\n`;
        response += `Date: ${booking.booking_date} ${booking.booking_time}\n\n`;
    });
    response += 'Reply "cancel #[booking number]" to cancel a specific booking.';

    return response;
}

/**
 * Handle view bookings
 */
async function handleViewBookings(business, customer, language) {
    const db = require('../database/db');
    const bookings = await new Promise((resolve, reject) => {
        db.all(
            `SELECT b.*, s.name as service_name FROM bookings b
             LEFT JOIN services s ON b.service_id = s.id
             WHERE b.customer_id = ? AND b.business_id = ?
             ORDER BY b.booking_date DESC, b.booking_time DESC
             LIMIT 10`,
            [customer.id, business.id],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });

    if (bookings.length === 0) {
        return 'You have no bookings. Reply "book" to make a new booking.';
    }

    let response = '📅 Your Bookings:\n\n';
    bookings.forEach(booking => {
        response += `#${booking.id} - ${booking.service_name}\n`;
        response += `Date: ${booking.booking_date} ${booking.booking_time}\n`;
        response += `Status: ${booking.status}\n\n`;
    });

    return response;
}

module.exports = {
    getServices,
    formatServicesList,
    handleMessage
};

