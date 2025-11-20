/**
 * Car Wash Module
 * Car wash specific features and message handling
 */

const db = require('../database/db');
const { getOperatingHours, sendWhatsAppMessage } = require('./generic');
const { createBooking, getAvailableTimeSlots } = require('./booking');

/**
 * Get services for car wash
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
            title: '🚗 Our Car Wash Services:',
            duration: 'Duration:',
            price: 'Price: R'
        },
        af: {
            title: '🚗 Ons Motorwassery Dienste:',
            duration: 'Duur:',
            price: 'Prys: R'
        },
        xh: {
            title: '🚗 Iinkonzo Zethu Zokuhlamba Iimoto:',
            duration: 'Ixesha:',
            price: 'Imali: R'
        },
        zu: {
            title: '🚗 Isevisi Zethu Zokugeza Izimoto:',
            duration: 'Isikhathi:',
            price: 'Inani: R'
        },
        st: {
            title: '🚗 Litšebeletso tsa Rona tsa Ho Hlatsoa Koloi:',
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
    response += '\nOr come in anytime during operating hours!';

    return response;
}

/**
 * Get queue status
 */
async function getQueueStatus(businessId) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT COUNT(*) as count FROM bookings
             WHERE business_id = ? AND booking_date = date('now') AND status IN ('pending', 'confirmed')`,
            [businessId],
            (err, row) => {
                if (err) reject(err);
                else {
                    const count = row ? row.count : 0;
                    const estimatedWait = count * 20; // 20 minutes per car
                    resolve({
                        queueLength: count,
                        estimatedWait: estimatedWait
                    });
                }
            }
        );
    });
}

/**
 * Handle car wash-specific messages
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

    // Queue status
    if (text.includes('queue') || text.includes('wait') || text.includes('busy') || text.includes('line')) {
        const queueStatus = await getQueueStatus(business.id);
        const messages = {
            en: `📊 Current Queue Status:\n\nCars in queue: ${queueStatus.queueLength}\nEstimated wait: ${queueStatus.estimatedWait} minutes\n\nBook ahead to skip the queue!`,
            af: `📊 Huidige Tuiswag Status:\n\nMotors in tou: ${queueStatus.queueLength}\nGeraamde wag: ${queueStatus.estimatedWait} minute\n\nBespreek vooruit om die tou te slaan!`,
            xh: `📊 Imeko Yejanjane:\n\nIimoto zikwimigca: ${queueStatus.queueLength}\nUkulinda okulinganiselweyo: ${queueStatus.estimatedWait} imizuzu`,
            zu: `📊 Isimo Sejanjane Samanje:\n\nIzimoto ezilindile: ${queueStatus.queueLength}\nUkulinda okulinganiselwe: ${queueStatus.estimatedWait} imizuzu`,
            st: `📊 Boemo ba Hajoale ba Lethathamo:\n\nLikoloi tse le thathamong: ${queueStatus.queueLength}\nHo emela ho lekanyelitsoeng: ${queueStatus.estimatedWait} metsotso`
        };
        return messages[language] || messages.en;
    }

    // Booking
    if (text.startsWith('book') || text.includes('appointment') || text.includes('schedule') || text.includes('reserve')) {
        return await handleBookingRequest(business, customer, messageText, language);
    }

    // Cancel booking
    if (text.includes('cancel')) {
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
    
    // Simple parsing
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

    // Find date
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

    // Find time
    const timeMatch = messageText.match(/\d{1,2}:\d{2}/);
    if (timeMatch) {
        time = timeMatch[0];
    }

    if (!serviceName || !date || !time) {
        const messages = {
            en: 'To book, please provide:\n• Service name\n• Date (YYYY-MM-DD)\n• Time (HH:MM)\n\nExample: "book premium wash 2024-01-15 14:00"\n\nOr reply "services" to see available services.',
            af: 'Om te bespreek, verskaf asseblief:\n• Diens naam\n• Datum\n• Tyd',
            xh: 'Ukubhukisha, nceda nike:\n• Igama lenkonzo\n• Umhla\n• Ixesha',
            zu: 'Ukubhukha, sicela unikeze:\n• Igama lensevisi\n• Usuku\n• Isikhathi',
            st: 'Ho buka, ka kopo fana ka:\n• Lebitso la tšebeletso\n• Letsatsi\n• Nako'
        };
        return messages[language] || messages.en;
    }

    const service = services.find(s => s.name.toLowerCase() === serviceName.toLowerCase());
    if (!service) {
        return 'Service not found. Reply "services" to see available services.';
    }

    const availableSlots = await getAvailableTimeSlots(business.id, date);
    if (!availableSlots.includes(time)) {
        return `Time slot ${time} is not available.\n\nAvailable times for ${date}:\n${availableSlots.slice(0, 10).join(', ')}`;
    }

    try {
        const booking = await createBooking(business.id, customer.id, service.id, date, time);
        
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
        return 'Sorry, there was an error creating your booking. Please try again.';
    }
}

/**
 * Handle cancel booking
 */
async function handleCancelBooking(business, customer, messageText, language) {
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

    const idMatch = messageText.match(/#?(\d+)/);
    if (idMatch && bookings.find(b => b.id === parseInt(idMatch[1]))) {
        const bookingId = parseInt(idMatch[1]);
        const { updateBookingStatus } = require('./booking');
        await updateBookingStatus(bookingId, 'cancelled');
        return '✅ Your booking has been cancelled.';
    }

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
    getQueueStatus,
    handleMessage
};

