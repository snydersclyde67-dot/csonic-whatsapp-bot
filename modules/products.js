/**
 * Products Module
 * Shared product and order logic for retail businesses (e.g., Spaza shops)
 */

const db = require('../database/db');
const { sendWhatsAppMessage } = require('./generic');

/**
 * Get all products for a business
 */
async function getProducts(businessId, filters = {}) {
    return new Promise((resolve, reject) => {
        let query = `SELECT * FROM products WHERE business_id = ?`;
        const params = [businessId];

        if (filters.category) {
            query += ` AND category = ?`;
            params.push(filters.category);
        }

        if (filters.inStock !== undefined) {
            if (filters.inStock) {
                query += ` AND stock > 0`;
            } else {
                query += ` AND stock = 0`;
            }
        }

        query += ` ORDER BY category, name`;

        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

/**
 * Get product by ID
 */
async function getProductById(productId) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT * FROM products WHERE id = ?`,
            [productId],
            (err, row) => {
                if (err) reject(err);
                else resolve(row);
            }
        );
    });
}

/**
 * Update product stock
 */
async function updateStock(productId, quantity) {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE products SET stock = stock + ? WHERE id = ?`,
            [quantity, productId],
            function(err) {
                if (err) reject(err);
                else resolve({ success: true, changes: this.changes });
            }
        );
    });
}

/**
 * Check if products are in stock
 */
async function checkStock(items) {
    const results = [];
    for (const item of items) {
        const product = await getProductById(item.product_id);
        if (!product) {
            results.push({ product_id: item.product_id, available: false, reason: 'Product not found' });
        } else if (product.stock < item.quantity) {
            results.push({ 
                product_id: item.product_id, 
                available: false, 
                reason: `Only ${product.stock} available`,
                requested: item.quantity
            });
        } else {
            results.push({ product_id: item.product_id, available: true });
        }
    }
    return results;
}

/**
 * Create an order
 */
async function createOrder(businessId, customerId, items, deliveryType = 'pickup', deliveryAddress = null) {
    // Calculate total
    let totalAmount = 0;
    const itemDetails = [];

    for (const item of items) {
        const product = await getProductById(item.product_id);
        if (!product) {
            throw new Error(`Product ${item.product_id} not found`);
        }
        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;
        itemDetails.push({
            product_id: product.id,
            name: product.name,
            quantity: item.quantity,
            price: product.price,
            total: itemTotal
        });
    }

    // Check stock availability
    const stockCheck = await checkStock(items);
    const unavailable = stockCheck.filter(item => !item.available);
    if (unavailable.length > 0) {
        throw new Error('Some items are out of stock');
    }

    // Create order
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO orders (business_id, customer_id, items, total_amount, delivery_type, delivery_address, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [businessId, customerId, JSON.stringify(itemDetails), totalAmount, deliveryType, deliveryAddress],
            async function(err) {
                if (err) {
                    reject(err);
                } else {
                    // Update stock
                    for (const item of items) {
                        await updateStock(item.product_id, -item.quantity);
                    }

                    resolve({
                        id: this.lastID,
                        business_id: businessId,
                        customer_id: customerId,
                        items: itemDetails,
                        total_amount: totalAmount,
                        delivery_type: deliveryType,
                        delivery_address: deliveryAddress,
                        status: 'pending'
                    });
                }
            }
        );
    });
}

/**
 * Get orders for a business
 */
async function getOrders(businessId, filters = {}) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT o.*, c.name as customer_name, c.phone_number
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE o.business_id = ?
        `;
        const params = [businessId];

        if (filters.status) {
            query += ` AND o.status = ?`;
            params.push(filters.status);
        }

        if (filters.customerId) {
            query += ` AND o.customer_id = ?`;
            params.push(filters.customerId);
        }

        query += ` ORDER BY o.created_at DESC`;

        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                // Parse items JSON
                const orders = rows.map(row => ({
                    ...row,
                    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
                }));
                resolve(orders);
            }
        });
    });
}

/**
 * Get order by ID
 */
async function getOrderById(orderId) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT o.*, c.name as customer_name, c.phone_number
             FROM orders o
             LEFT JOIN customers c ON o.customer_id = c.id
             WHERE o.id = ?`,
            [orderId],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    if (row) {
                        row.items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
                    }
                    resolve(row);
                }
            }
        );
    });
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, status) {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE orders SET status = ? WHERE id = ?`,
            [status, orderId],
            function(err) {
                if (err) reject(err);
                else resolve({ success: true, changes: this.changes });
            }
        );
    });
}

/**
 * Format product catalog as message
 */
function formatProductCatalog(products, language = 'en') {
    const messages = {
        en: {
            title: '📦 Our Products:',
            outOfStock: ' (Out of Stock)',
            price: 'Price: R',
            stock: 'Stock:'
        },
        af: {
            title: '📦 Ons Produkte:',
            outOfStock: ' (Uit Voorraad)',
            price: 'Prys: R',
            stock: 'Voorraad:'
        },
        xh: {
            title: '📦 Iimveliso Zethu:',
            outOfStock: ' (Ayikho)',
            price: 'Imali: R',
            stock: 'Isitokhwe:'
        },
        zu: {
            title: '📦 Imikhiqizo Yethu:',
            outOfStock: ' (Ayikho)',
            price: 'Inani: R',
            stock: 'Isitokhwe:'
        },
        st: {
            title: '📦 Lihlahisoa la Rona:',
            outOfStock: ' (Ha e se na)',
            price: 'Theko: R',
            stock: 'Sefate:'
        }
    };

    const msg = messages[language] || messages.en;
    let catalog = msg.title + '\n\n';

    // Group by category
    const byCategory = {};
    products.forEach(product => {
        const cat = product.category || 'Other';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(product);
    });

    for (const [category, items] of Object.entries(byCategory)) {
        catalog += `\n*${category}*\n`;
        items.forEach(product => {
            catalog += `• ${product.name}`;
            if (product.description) {
                catalog += ` - ${product.description}`;
            }
            catalog += `\n  ${msg.price}${product.price.toFixed(2)}`;
            if (product.stock !== null) {
                if (product.stock > 0) {
                    catalog += ` | ${msg.stock} ${product.stock}`;
                } else {
                    catalog += msg.outOfStock;
                }
            }
            catalog += '\n';
        });
    }

    catalog += '\nTo order, reply "order" followed by item names and quantities.';
    return catalog;
}

/**
 * Send order confirmation
 */
async function sendOrderConfirmation(order, business, customer) {
    let message = `✅ Order Confirmed!\n\n`;
    message += `Order #${order.id}\n\n`;
    message += `Items:\n`;
    
    order.items.forEach(item => {
        message += `• ${item.name} x${item.quantity} - R${item.total.toFixed(2)}\n`;
    });
    
    message += `\nTotal: R${order.total_amount.toFixed(2)}\n`;
    message += `Delivery: ${order.delivery_type}\n`;
    if (order.delivery_address) {
        message += `Address: ${order.delivery_address}\n`;
    }
    message += `\nStatus: ${order.status}\n`;
    message += `\nWe'll notify you when your order is ready!`;

    return await sendWhatsAppMessage(customer.phone_number, message, business.id);
}

module.exports = {
    getProducts,
    getProductById,
    updateStock,
    checkStock,
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    formatProductCatalog,
    sendOrderConfirmation
};

