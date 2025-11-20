/**
 * Message Parser Service
 * Routes messages to appropriate business modules
 */

const { findBusinessByPhone, getBusinessInfo } = require('../modules/generic');
const barberModule = require('../modules/barber');
const carwashModule = require('../modules/carwash');
const spazaModule = require('../modules/spaza');

/**
 * Business type to module mapping
 */
const businessModules = {
    barber: barberModule,
    carwash: carwashModule,
    spaza: spazaModule
};

/**
 * Parse and route incoming message
 */
async function parseMessage(from, messageText) {
    try {
        // Find business by phone number
        const business = await findBusinessByPhone(from);
        
        if (!business) {
            // No business found - could be a new customer or wrong number
            return {
                success: false,
                message: 'Sorry, we couldn\'t find a business associated with this number. Please contact the business directly.'
            };
        }

        // Get or create customer
        const { getOrCreateCustomer } = require('../modules/generic');
        const customer = await getOrCreateCustomer(from, business.id);

        // Get the appropriate module
        const module = businessModules[business.type];
        
        if (!module) {
            return {
                success: false,
                message: 'Business type not supported.'
            };
        }

        // Handle message with business-specific module
        let response = null;
        if (module.handleMessage) {
            response = await module.handleMessage(business, customer, messageText);
        }

        // If module didn't handle it, return null to let AI service handle
        return {
            success: true,
            business: business,
            customer: customer,
            response: response,
            handled: response !== null
        };

    } catch (error) {
        console.error('Error parsing message:', error);
        return {
            success: false,
            message: 'Sorry, there was an error processing your message. Please try again.'
        };
    }
}

/**
 * Detect language from message
 */
function detectLanguage(messageText) {
    // Simple keyword-based detection
    const afrikaansKeywords = ['hallo', 'dankie', 'asseblief', 'ja', 'nee'];
    const xhosaKeywords = ['molo', 'enkosi', 'ndiyabulela', 'ewe', 'hayi'];
    const zuluKeywords = ['sawubona', 'ngiyabonga', 'yebo', 'cha'];
    const sothoKeywords = ['dumela', 'kea leboha', 'e', 'che'];

    const text = messageText.toLowerCase();

    if (afrikaansKeywords.some(kw => text.includes(kw))) return 'af';
    if (xhosaKeywords.some(kw => text.includes(kw))) return 'xh';
    if (zuluKeywords.some(kw => text.includes(kw))) return 'zu';
    if (sothoKeywords.some(kw => text.includes(kw))) return 'st';
    
    return 'en'; // Default to English
}

module.exports = {
    parseMessage,
    detectLanguage,
    businessModules
};

