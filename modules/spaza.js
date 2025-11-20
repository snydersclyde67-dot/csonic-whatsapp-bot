/**
 * Spaza Module
 * Spaza shop specific features and message handling
 */

const db = require('../database/db');
const { getOperatingHours, sendWhatsAppMessage } = require('./generic');
const { getProducts, formatProductCatalog, createOrder, getOrders } = require('./products');

/**
 * Handle spaza shop-specific messages
 */
async function handleMessage(business, customer, messageText) {
    const text = messageText.toLowerCase().trim();
    const language = customer.language || business.language || 'en';

    // Get products/menu
    if (text.includes('menu') || text.includes('product') || text.includes('catalog') || text.includes('list') || text.includes('price')) {
        const products = await getProducts(business.id, { inStock: true });
        return formatProductCatalog(products, language);
    }

    // Get hours
    if (text.includes('hour') || text.includes('open') || text.includes('close') || text.includes('time')) {
        return getOperatingHours(business);
    }

    // Order
    if (text.startsWith('order') || text.includes('buy') || text.includes('purchase') || text.startsWith('i want')) {
        return await handleOrderRequest(business, customer, messageText, language);
    }

    // View orders
    if (text.includes('my order') || text.includes('my purchase')) {
        return await handleViewOrders(business, customer, language);
    }

    // Delivery info
    if (text.includes('delivery') || text.includes('deliver')) {
        const messages = {
            en: '📦 Delivery Information:\n\n• Minimum order: R100\n• Delivery fee: R20\n• Delivery available within 5km radius\n• Same day delivery for orders before 3pm\n\nReply "order" to place an order.',
            af: '📦 Aflewering Inligting:\n\n• Minimum bestelling: R100\n• Aflewering fooi: R20\n• Aflewering beskikbaar binne 5km radius',
            xh: '📦 Ulwazi Lweendleko:\n\n• Umyalelo ophantsi: R100\n• Imali yendleko: R20',
            zu: '📦 Ulwazi Lokulethwa:\n\n• Oda eliphansi: R100\n• Imali yokulethwa: R20',
            st: '📦 Tlhahisoleseding ea Ho Fetisetsa:\n\n• Taolo e tlase: R100\n• Teefo ea ho fetisetsa: R20'
        };
        return messages[language] || messages.en;
    }

    // Stock inquiry
    if (text.includes('stock') || text.includes('available') || text.includes('have')) {
        const productName = text.replace(/stock|available|have|do you/i, '').trim();
        if (productName) {
            return await handleStockInquiry(business, productName, language);
        }
        return 'Please specify which product you want to check. Example: "stock bread"';
    }

    return null; // Let AI service handle if no match
}

/**
 * Handle order request
 */
async function handleOrderRequest(business, customer, messageText, language) {
    // Simple order parsing - in production, use NLP
    const products = await getProducts(business.id);
    
    // Try to extract items from message
    // Format: "order 2 bread, 1 milk, 3 eggs"
    const orderItems = [];
    const text = messageText.toLowerCase();

    // Match patterns like "2 bread", "bread x2", "1x milk"
    const patterns = [
        /(\d+)\s*(\w+)/g,
        /(\w+)\s*x\s*(\d+)/g,
        /(\d+)\s*x\s*(\w+)/g
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const quantity = parseInt(match[1] || match[2]);
            const productName = (match[2] || match[1]).toLowerCase();

            // Find matching product
            const product = products.find(p => 
                p.name.toLowerCase().includes(productName) ||
                productName.includes(p.name.toLowerCase().split(' ')[0])
            );

            if (product && product.stock >= quantity) {
                orderItems.push({
                    product_id: product.id,
                    quantity: quantity
                });
            }
        }
    }

    if (orderItems.length === 0) {
        const messages = {
            en: 'To place an order, please specify items and quantities.\n\nExample: "order 2 bread, 1 milk, 3 eggs"\n\nOr reply "menu" to see available products.',
            af: 'Om \'n bestelling te plaas, spesifiseer asseblief items en hoeveelhede.',
            xh: 'Ukubeka umyalelo, nceda cazulula izinto kunye neembalo.',
            zu: 'Ukubeka i-oda, sicela unikeze izinto kanye nezinga.',
            st: 'Ho beha taelo, ka kopo fana ka lihlahisoa le palo.'
        };
        return messages[language] || messages.en;
    }

    // Check delivery preference
    const deliveryType = text.includes('delivery') || text.includes('deliver') ? 'delivery' : 'pickup';
    let deliveryAddress = null;
    
    if (deliveryType === 'delivery') {
        // Try to extract address (simple - in production, use NLP)
        const addressMatch = messageText.match(/address[:\s]+(.+)/i);
        if (addressMatch) {
            deliveryAddress = addressMatch[1].trim();
        }
    }

    try {
        const order = await createOrder(business.id, customer.id, orderItems, deliveryType, deliveryAddress);
        
        let confirmation = `✅ Order Created!\n\nOrder #${order.id}\n\nItems:\n`;
        order.items.forEach(item => {
            confirmation += `• ${item.name} x${item.quantity} - R${item.total.toFixed(2)}\n`;
        });
        confirmation += `\nTotal: R${order.total_amount.toFixed(2)}\n`;
        confirmation += `Delivery: ${deliveryType}\n`;
        if (deliveryAddress) {
            confirmation += `Address: ${deliveryAddress}\n`;
        }
        confirmation += `\nStatus: ${order.status}\n\nWe'll notify you when your order is ready!`;

        await sendWhatsAppMessage(customer.phone_number, confirmation, business.id);
        return confirmation;
    } catch (error) {
        console.error('Error creating order:', error);
        if (error.message.includes('out of stock')) {
            return 'Sorry, some items are out of stock. Reply "menu" to see current stock.';
        }
        return 'Sorry, there was an error processing your order. Please try again.';
    }
}

/**
 * Handle view orders
 */
async function handleViewOrders(business, customer, language) {
    const orders = await getOrders(business.id, { customerId: customer.id });

    if (orders.length === 0) {
        const messages = {
            en: 'You have no orders. Reply "order" to place a new order.',
            af: 'Jy het geen bestellings nie.',
            xh: 'Awunayo imiyalelo.',
            zu: 'Awunazo izimpawu.',
            st: 'Ha u na litaelo.'
        };
        return messages[language] || messages.en;
    }

    let response = '📦 Your Orders:\n\n';
    orders.slice(0, 5).forEach(order => {
        response += `Order #${order.id}\n`;
        response += `Date: ${order.created_at.split(' ')[0]}\n`;
        order.items.forEach(item => {
            response += `• ${item.name} x${item.quantity}\n`;
        });
        response += `Total: R${order.total_amount.toFixed(2)}\n`;
        response += `Status: ${order.status}\n\n`;
    });

    return response;
}

/**
 * Handle stock inquiry
 */
async function handleStockInquiry(business, productName, language) {
    const products = await getProducts(business.id);
    const product = products.find(p => 
        p.name.toLowerCase().includes(productName) ||
        productName.includes(p.name.toLowerCase().split(' ')[0])
    );

    if (!product) {
        return `Product "${productName}" not found. Reply "menu" to see all products.`;
    }

    const messages = {
        en: {
            inStock: `✅ ${product.name} is available!\n\nPrice: R${product.price.toFixed(2)}\nStock: ${product.stock} units`,
            outOfStock: `❌ ${product.name} is currently out of stock.\n\nPrice: R${product.price.toFixed(2)}\nWe'll restock soon!`
        },
        af: {
            inStock: `✅ ${product.name} is beskikbaar!\n\nPrys: R${product.price.toFixed(2)}\nVoorraad: ${product.stock} eenhede`,
            outOfStock: `❌ ${product.name} is tans uit voorraad.`
        },
        xh: {
            inStock: `✅ ${product.name} ifumaneka!\n\nImali: R${product.price.toFixed(2)}\nIsitokhwe: ${product.stock}`,
            outOfStock: `❌ ${product.name} ayikho ngoku.`
        },
        zu: {
            inStock: `✅ ${product.name} iyatholakala!\n\nInani: R${product.price.toFixed(2)}\nIsitokhwe: ${product.stock}`,
            outOfStock: `❌ ${product.name} ayikho njengamanje.`
        },
        st: {
            inStock: `✅ ${product.name} e fumaneha!\n\nTheko: R${product.price.toFixed(2)}\nSefate: ${product.stock}`,
            outOfStock: `❌ ${product.name} ha e se na hajoale.`
        }
    };

    const msg = messages[language] || messages.en;
    return product.stock > 0 ? msg.inStock : msg.outOfStock;
}

module.exports = {
    handleMessage
};

