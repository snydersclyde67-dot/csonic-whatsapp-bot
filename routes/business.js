/**
 * Business Management API Routes
 * Handles CRUD operations for businesses, bookings, orders, etc.
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { getBookings, createBooking, updateBookingStatus } = require('../modules/booking');
const { getProducts, createOrder, getOrders, updateOrderStatus } = require('../modules/products');
const { getAllBusinesses, getBusinessInfo } = require('../modules/generic');

/**
 * Get all businesses
 */
router.get('/api/businesses', async (req, res) => {
    try {
        const businesses = await getAllBusinesses();
        res.json(businesses);
    } catch (error) {
        console.error('Error fetching businesses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get business by ID
 */
router.get('/api/businesses/:id', async (req, res) => {
    try {
        const business = await getBusinessInfo(parseInt(req.params.id));
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }
        res.json(business);
    } catch (error) {
        console.error('Error fetching business:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Create new business
 */
router.post('/api/businesses', async (req, res) => {
    try {
        const { name, type, phone_number, whatsapp_number, location, language, operating_hours, ai_enabled } = req.body;

        if (!name || !type || !phone_number || !whatsapp_number) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const businessId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO businesses (name, type, phone_number, whatsapp_number, location, language, operating_hours, ai_enabled)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    name,
                    type,
                    phone_number,
                    whatsapp_number,
                    location || null,
                    language || 'en',
                    typeof operating_hours === 'object' ? JSON.stringify(operating_hours) : operating_hours || null,
                    ai_enabled !== undefined ? (ai_enabled ? 1 : 0) : 1
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        const business = await getBusinessInfo(businessId);
        res.status(201).json(business);
    } catch (error) {
        console.error('Error creating business:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Update business
 */
router.put('/api/businesses/:id', async (req, res) => {
    try {
        const { name, type, phone_number, whatsapp_number, location, language, operating_hours, ai_enabled } = req.body;

        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (type !== undefined) {
            updates.push('type = ?');
            params.push(type);
        }
        if (phone_number !== undefined) {
            updates.push('phone_number = ?');
            params.push(phone_number);
        }
        if (whatsapp_number !== undefined) {
            updates.push('whatsapp_number = ?');
            params.push(whatsapp_number);
        }
        if (location !== undefined) {
            updates.push('location = ?');
            params.push(location);
        }
        if (language !== undefined) {
            updates.push('language = ?');
            params.push(language);
        }
        if (operating_hours !== undefined) {
            updates.push('operating_hours = ?');
            params.push(typeof operating_hours === 'object' ? JSON.stringify(operating_hours) : operating_hours);
        }
        if (ai_enabled !== undefined) {
            updates.push('ai_enabled = ?');
            params.push(ai_enabled ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(parseInt(req.params.id));

        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE businesses SET ${updates.join(', ')} WHERE id = ?`,
                params,
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        const business = await getBusinessInfo(parseInt(req.params.id));
        res.json(business);
    } catch (error) {
        console.error('Error updating business:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Delete business
 */
router.delete('/api/businesses/:id', async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            db.run(
                `DELETE FROM businesses WHERE id = ?`,
                [parseInt(req.params.id)],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting business:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get bookings
 */
router.get('/api/bookings', async (req, res) => {
    try {
        const { businessId, status, date, dateFrom } = req.query;
        const filters = {};

        if (businessId) filters.businessId = parseInt(businessId);
        if (status) filters.status = status;
        if (date) filters.date = date;
        if (dateFrom) filters.dateFrom = dateFrom;

        if (filters.businessId) {
            const bookings = await getBookings(filters.businessId, filters);
            res.json(bookings);
        } else {
            const { getAllBookings } = require('../services/bookingService');
            const bookings = await getAllBookings(filters);
            res.json(bookings);
        }
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Create booking
 */
router.post('/api/bookings', async (req, res) => {
    try {
        const { businessId, customerId, serviceId, bookingDate, bookingTime, notes } = req.body;

        if (!businessId || !customerId || !serviceId || !bookingDate || !bookingTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const booking = await createBooking(businessId, customerId, serviceId, bookingDate, bookingTime, notes);
        res.status(201).json(booking);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Update booking status
 */
router.put('/api/bookings/:id', async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Missing status field' });
        }

        await updateBookingStatus(parseInt(req.params.id), status);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get orders
 */
router.get('/api/orders', async (req, res) => {
    try {
        const { businessId, status, customerId } = req.query;

        if (!businessId) {
            return res.status(400).json({ error: 'businessId is required' });
        }

        const filters = {};
        if (status) filters.status = status;
        if (customerId) filters.customerId = parseInt(customerId);

        const orders = await getOrders(parseInt(businessId), filters);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Update order status
 */
router.put('/api/orders/:id', async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Missing status field' });
        }

        await updateOrderStatus(parseInt(req.params.id), status);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get services
 */
router.get('/api/services', async (req, res) => {
    try {
        const { businessId } = req.query;

        if (!businessId) {
            return res.status(400).json({ error: 'businessId is required' });
        }

        db.all(
            `SELECT * FROM services WHERE business_id = ? ORDER BY price`,
            [parseInt(businessId)],
            (err, rows) => {
                if (err) {
                    console.error('Error fetching services:', err);
                    res.status(500).json({ error: 'Internal server error' });
                } else {
                    res.json(rows || []);
                }
            }
        );
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get products
 */
router.get('/api/products', async (req, res) => {
    try {
        const { businessId, category, inStock } = req.query;

        if (!businessId) {
            return res.status(400).json({ error: 'businessId is required' });
        }

        const filters = {};
        if (category) filters.category = category;
        if (inStock !== undefined) filters.inStock = inStock === 'true';

        const products = await getProducts(parseInt(businessId), filters);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get messages
 */
router.get('/api/messages', async (req, res) => {
    try {
        const { businessId, customerId, limit = 50 } = req.query;

        let query = `SELECT m.*, b.name as business_name, c.name as customer_name 
                     FROM messages m
                     LEFT JOIN businesses b ON m.business_id = b.id
                     LEFT JOIN customers c ON m.customer_id = c.id
                     WHERE 1=1`;
        const params = [];

        if (businessId) {
            query += ` AND m.business_id = ?`;
            params.push(parseInt(businessId));
        }

        if (customerId) {
            query += ` AND m.customer_id = ?`;
            params.push(parseInt(customerId));
        }

        query += ` ORDER BY m.timestamp DESC LIMIT ?`;
        params.push(parseInt(limit));

        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('Error fetching messages:', err);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                res.json(rows || []);
            }
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

