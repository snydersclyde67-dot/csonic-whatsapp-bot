/**
 * Generic Module
 * Core functions shared by all business types
 */

const db = require('../database/db');
const whatsappConfig = require('../config/whatsapp');

/**
 * Get business information
 */
async function getBusinessInfo(businessId) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT * FROM businesses WHERE id = ?`,
            [businessId],
            (err, row) => {
                if (err) reject(err);
                else resolve(row);
            }
        );
    });
}

/**
 * Get or create customer
 */
async function getOrCreateCustomer(phoneNumber, businessId, name = null) {
    return new Promise((resolve, reject) => {
        // Try to find existing customer
        db.get(
            `SELECT * FROM customers WHERE phone_number = ? AND business_id = ?`,
            [phoneNumber, businessId],
            async (err, customer) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (customer) {
                    // Update last interaction
                    db.run(
                        `UPDATE customers SET last_interaction = CURRENT_TIMESTAMP WHERE id = ?`,
                        [customer.id],
                        () => resolve(customer)
                    );
                } else {
                    // Create new customer
                    db.run(
                        `INSERT INTO customers (name, phone_number, business_id, language)
                         VALUES (?, ?, ?, ?)`,
                        [name || 'Customer', phoneNumber, businessId, 'en'],
                        function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({
                                    id: this.lastID,
                                    name: name || 'Customer',
                                    phone_number: phoneNumber,
                                    business_id: businessId,
                                    language: 'en'
                                });
                            }
                        }
                    );
                }
            }
        );
    });
}

/**
 * Save incoming message
 */
async function saveMessage(businessId, customerId, messageText, direction = 'incoming') {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO messages (business_id, customer_id, direction, message_text, message_type)
             VALUES (?, ?, ?, ?, ?)`,
            [businessId, customerId, direction, messageText, 'text'],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

/**
 * Send WhatsApp message
 */
async function sendWhatsAppMessage(to, message, businessId = null) {
    const axios = require('axios');
    const { accessToken, phoneNumberId, apiVersion, graphBaseUrl } = whatsappConfig;

    if (!accessToken || !phoneNumberId) {
        console.error('WhatsApp credentials not configured');
        return { success: false, error: 'WhatsApp not configured' };
    }

    try {
        const response = await axios.post(
            `${graphBaseUrl}/${apiVersion}/${phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Save outgoing message if businessId provided
        if (businessId) {
            const customer = await getOrCreateCustomer(to, businessId);
            await saveMessage(businessId, customer.id, message, 'outgoing');
        }

        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

/**
 * Get greeting message based on business and language
 */
function getGreeting(business, customer = null) {
    const language = customer?.language || business.language || 'en';
    const businessName = business.name;

    const greetings = {
        en: `Hello! Welcome to ${businessName}. How can we help you today?`,
        af: `Hallo! Welkom by ${businessName}. Hoe kan ons jou help vandag?`,
        xh: `Molo! Wamkelekile e-${businessName}. Singakunceda njani namhlanje?`,
        zu: `Sawubona! Siyakwamukela e-${businessName}. Singakusiza kanjani namuhla?`,
        st: `Dumela! Rea u amohela ho ${businessName}. Re ka u thusa joang kajeno?`
    };

    return greetings[language] || greetings.en;
}

/**
 * Get operating hours message
 */
function getOperatingHours(business) {
    const language = business.language || 'en';
    let hours;
    
    try {
        hours = typeof business.operating_hours === 'string' 
            ? JSON.parse(business.operating_hours) 
            : business.operating_hours;
    } catch (e) {
        hours = {};
    }

    const messages = {
        en: {
            title: 'Our Operating Hours:',
            closed: 'We are currently closed.',
            open: 'We are open!'
        },
        af: {
            title: 'Ons Bedryfstye:',
            closed: 'Ons is tans gesluit.',
            open: 'Ons is oop!'
        },
        xh: {
            title: 'Iiyure Zethu Zokusebenza:',
            closed: 'Sivaliwe ngoku.',
            open: 'Sivulekile!'
        },
        zu: {
            title: 'Amahora Ethu Okusebenza:',
            closed: 'Sivaliwe njengamanje.',
            open: 'Sivulekile!'
        },
        st: {
            title: 'Lihora la Rona la Tshebetso:',
            closed: 'Re koaletsoe hajoale.',
            open: 'Re buleha!'
        }
    };

    const msg = messages[language] || messages.en;
    let response = msg.title + '\n\n';

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = {
        en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        af: ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrydag', 'Saterdag', 'Sondag'],
        xh: ['Mvulo', 'Lwesibini', 'Lwesithathu', 'Lwesine', 'Lwesihlanu', 'Mgqibelo', 'Cawe'],
        zu: ['Msombuluko', 'Lwesibili', 'Lwesithathu', 'Lwesine', 'Lwesihlanu', 'Mgqibelo', 'Sonto'],
        st: ['Mantaha', 'Labobedi', 'Laboraro', 'Labone', 'Labohlano', 'Moqebelo', 'Sontaha']
    };

    const names = dayNames[language] || dayNames.en;

    days.forEach((day, index) => {
        const hoursStr = hours[day] || 'Closed';
        response += `${names[index]}: ${hoursStr}\n`;
    });

    return response;
}

/**
 * Find business by phone number
 */
async function findBusinessByPhone(phoneNumber) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT * FROM businesses WHERE whatsapp_number = ? OR phone_number = ?`,
            [phoneNumber, phoneNumber],
            (err, row) => {
                if (err) reject(err);
                else resolve(row);
            }
        );
    });
}

/**
 * Get all businesses
 */
async function getAllBusinesses() {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM businesses ORDER BY name`,
            [],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });
}

module.exports = {
    getBusinessInfo,
    getOrCreateCustomer,
    saveMessage,
    sendWhatsAppMessage,
    getGreeting,
    getOperatingHours,
    findBusinessByPhone,
    getAllBusinesses
};

