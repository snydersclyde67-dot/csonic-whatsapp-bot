/**
 * WhatsApp Cloud API Configuration
 * Central place to read and validate credentials for local + Render deploys
 */

require('dotenv').config();

const FALLBACK_ACCESS_TOKEN = 'EAAV0PpQL4YYBQPzt66NVmOg0dpyonnKJeWBZBZACdZAZBqCJOroMFUCxYP09vj14zIHcu59EIJZBJMTQ14sqg8D7NWjC7MLg6E8Th2jl4lddZB6or5nKKfRhQ4DnAMakHZA61AKs7ZBSqNZBC1Ar204pzz0ycPbqpcqAa6WskKtgYJumRcxGdqtshZBjRyLUHGze8g35Vw3qgWWWTIojBh1RGLX1Iu3ZBLon8L0McpudXReiXsIWYXCkpBAjBL3Pfsd7wlkJsUjtFKdJcN0jp37n4yfkX4E';
const FALLBACK_PHONE_NUMBER_ID = '834177856454488';
const FALLBACK_BUSINESS_ACCOUNT_ID = '25281166581541279';
const DEFAULT_VERIFY_TOKEN = 'csonic-verify-token';

const whatsappConfig = {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || FALLBACK_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || FALLBACK_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || FALLBACK_BUSINESS_ACCOUNT_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || DEFAULT_VERIFY_TOKEN,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
    graphBaseUrl: process.env.GRAPH_API_BASE_URL || 'https://graph.facebook.com'
};

if (!process.env.WHATSAPP_ACCESS_TOKEN) {
    console.warn('⚠️  Using the fallback WhatsApp access token from config/whatsapp.js. Set WHATSAPP_ACCESS_TOKEN in your environment for production deployments.');
}

module.exports = whatsappConfig;


