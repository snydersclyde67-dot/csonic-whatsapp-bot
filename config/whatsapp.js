/**
 * WhatsApp Cloud API Configuration
 * Central place to read and validate credentials for local + Render deploys
 */

require('dotenv').config();

const FALLBACK_WHATSAPP_TOKEN = 'EAAV0PpQL4YYBQPzt66NVmOg0dpyonnKJeWBZBZACdZAZBqCJOroMFUCxYP09vj14zIHcu59EIJZBJMTQ14sqg8D7NWjC7MLg6E8Th2jl4lddZB6or5nKKfRhQ4DnAMakHZA61AKs7ZBSqNZBC1Ar204pzz0ycPbqpcqAa6WskKtgYJumRcxGdqtshZBjRyLUHGze8g35Vw3qgWWWTIojBh1RGLX1Iu3ZBLon8L0McpudXReiXsIWYXCkpBAjBL3Pfsd7wlkJsUjtFKdJcN0jp37n4yfkX4E';
const FALLBACK_PHONE_NUMBER_ID = '834177856454488';
const DEFAULT_VERIFY_TOKEN = 'csonic-verify-token';

const whatsappConfig = {
    token: process.env.WHATSAPP_TOKEN || FALLBACK_WHATSAPP_TOKEN,
    phoneNumberId: process.env.PHONE_NUMBER_ID || FALLBACK_PHONE_NUMBER_ID,
    verifyToken: process.env.VERIFY_TOKEN || DEFAULT_VERIFY_TOKEN,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
    graphBaseUrl: process.env.GRAPH_API_BASE_URL || 'https://graph.facebook.com'
};

if (!process.env.WHATSAPP_TOKEN) {
    console.warn('⚠️  Using the fallback WhatsApp token. Set WHATSAPP_TOKEN in your environment for production deployments.');
}

module.exports = whatsappConfig;


