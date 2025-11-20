/**
 * Database Seeding Script
 * Populates the database with test data for three example businesses
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'businesses.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to database for seeding...');
});

// Helper function to run SQL queries
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
}

async function seedDatabase() {
    try {
        console.log('Starting database seeding...');

        // 1. Fresh Cuts Barbers (Barber Shop)
        const barberId = await runQuery(
            `INSERT INTO businesses (name, type, phone_number, whatsapp_number, location, language, operating_hours, ai_enabled)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Fresh Cuts Barbers',
                'barber',
                '+27112345678',
                '+27112345678',
                '123 Main Street, Cape Town',
                'en',
                JSON.stringify({
                    monday: '09:00-18:00',
                    tuesday: '09:00-18:00',
                    wednesday: '09:00-18:00',
                    thursday: '09:00-18:00',
                    friday: '09:00-19:00',
                    saturday: '08:00-17:00',
                    sunday: '10:00-15:00'
                }),
                1
            ]
        );

        // Barber services
        const barberServices = [
            ['Haircut', 'Standard haircut with styling', 150, 30],
            ['Beard Trim', 'Professional beard trimming', 80, 15],
            ['Haircut + Beard', 'Full grooming package', 200, 45],
            ['Line Up', 'Hairline and beard line up', 100, 20],
            ['Hot Towel Shave', 'Traditional hot towel shave', 120, 25]
        ];

        for (const [name, desc, price, duration] of barberServices) {
            await runQuery(
                `INSERT INTO services (business_id, name, description, price, duration)
                 VALUES (?, ?, ?, ?, ?)`,
                [barberId, name, desc, price, duration]
            );
        }

        // Barber FAQ rules
        const barberFAQs = [
            ['hours|opening|when|time', 'We are open Monday-Friday 9am-6pm, Saturday 8am-5pm, Sunday 10am-3pm', 'en'],
            ['price|cost|how much', 'Our services start from R80. Type "services" to see all prices.', 'en'],
            ['book|appointment|schedule', 'To book, reply with "book" followed by the service name and preferred date/time.', 'en'],
            ['cancel|reschedule', 'To cancel or reschedule, reply with "cancel" or "reschedule" followed by your booking reference.', 'en']
        ];

        for (const [pattern, answer, lang] of barberFAQs) {
            await runQuery(
                `INSERT INTO faq_rules (business_id, question_pattern, answer, language)
                 VALUES (?, ?, ?, ?)`,
                [barberId, pattern, answer, lang]
            );
        }

        // 2. Shiny Wheels (Car Wash)
        const carwashId = await runQuery(
            `INSERT INTO businesses (name, type, phone_number, whatsapp_number, location, language, operating_hours, ai_enabled)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Shiny Wheels',
                'carwash',
                '+27112345679',
                '+27112345679',
                '456 Auto Street, Johannesburg',
                'en',
                JSON.stringify({
                    monday: '08:00-17:00',
                    tuesday: '08:00-17:00',
                    wednesday: '08:00-17:00',
                    thursday: '08:00-17:00',
                    friday: '08:00-18:00',
                    saturday: '08:00-16:00',
                    sunday: '09:00-14:00'
                }),
                1
            ]
        );

        // Car wash services
        const carwashServices = [
            ['Basic Wash', 'Exterior wash and dry', 80, 20],
            ['Premium Wash', 'Exterior wash, tire shine, interior vacuum', 150, 40],
            ['Full Detail', 'Complete interior and exterior detailing', 500, 120],
            ['Wax & Polish', 'Wax application and polish', 200, 60],
            ['Interior Clean', 'Deep interior cleaning and vacuum', 180, 45]
        ];

        for (const [name, desc, price, duration] of carwashServices) {
            await runQuery(
                `INSERT INTO services (business_id, name, description, price, duration)
                 VALUES (?, ?, ?, ?, ?)`,
                [carwashId, name, desc, price, duration]
            );
        }

        // Car wash FAQ rules
        const carwashFAQs = [
            ['hours|opening|when', 'We are open Monday-Friday 8am-5pm, Saturday 8am-4pm, Sunday 9am-2pm', 'en'],
            ['price|cost|how much', 'Services start from R80. Type "services" for full pricing.', 'en'],
            ['queue|wait|busy', 'Current wait time is usually 15-30 minutes. Book ahead to skip the queue!', 'en'],
            ['book|appointment', 'Reply "book" followed by service name and preferred time to reserve your slot.', 'en']
        ];

        for (const [pattern, answer, lang] of carwashFAQs) {
            await runQuery(
                `INSERT INTO faq_rules (business_id, question_pattern, answer, language)
                 VALUES (?, ?, ?, ?)`,
                [carwashId, pattern, answer, lang]
            );
        }

        // 3. Town Spaza (Spaza Shop)
        const spazaId = await runQuery(
            `INSERT INTO businesses (name, type, phone_number, whatsapp_number, location, language, operating_hours, ai_enabled)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Town Spaza',
                'spaza',
                '+27112345680',
                '+27112345680',
                '789 Market Road, Durban',
                'en',
                JSON.stringify({
                    monday: '07:00-20:00',
                    tuesday: '07:00-20:00',
                    wednesday: '07:00-20:00',
                    thursday: '07:00-20:00',
                    friday: '07:00-21:00',
                    saturday: '07:00-20:00',
                    sunday: '08:00-19:00'
                }),
                1
            ]
        );

        // Spaza products
        const spazaProducts = [
            ['Bread (White)', 'Fresh white bread loaf', 15, 50, 'Food'],
            ['Milk (2L)', 'Fresh full cream milk', 28, 30, 'Dairy'],
            ['Eggs (Dozen)', 'Free range eggs', 35, 25, 'Food'],
            ['Cooking Oil (2L)', 'Sunflower cooking oil', 45, 20, 'Pantry'],
            ['Rice (2kg)', 'Long grain rice', 55, 15, 'Pantry'],
            ['Sugar (2kg)', 'White sugar', 42, 18, 'Pantry'],
            ['Coca Cola (2L)', 'Cold drink', 25, 40, 'Beverages'],
            ['Chips (Large)', 'Potato chips', 18, 35, 'Snacks'],
            ['Soap Bar', 'Bathing soap', 12, 30, 'Personal Care'],
            ['Toilet Paper (4 pack)', 'Soft toilet paper', 45, 20, 'Personal Care']
        ];

        for (const [name, desc, price, stock, category] of spazaProducts) {
            await runQuery(
                `INSERT INTO products (business_id, name, description, price, stock, category)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [spazaId, name, desc, price, stock, category]
            );
        }

        // Spaza FAQ rules
        const spazaFAQs = [
            ['hours|opening|when', 'We are open Monday-Saturday 7am-8pm, Sunday 8am-7pm', 'en'],
            ['price|cost|how much', 'Type "menu" or "products" to see all items and prices.', 'en'],
            ['order|buy|purchase', 'Reply "order" followed by item names and quantities. We offer pickup and delivery!', 'en'],
            ['delivery|deliver', 'Delivery available for orders over R100. Delivery fee R20.', 'en'],
            ['stock|available|have', 'Type "menu" to see current stock. Items update in real-time.', 'en']
        ];

        for (const [pattern, answer, lang] of spazaFAQs) {
            await runQuery(
                `INSERT INTO faq_rules (business_id, question_pattern, answer, language)
                 VALUES (?, ?, ?, ?)`,
                [spazaId, pattern, answer, lang]
            );
        }

        console.log('✅ Database seeded successfully!');
        console.log(`   - Fresh Cuts Barbers (ID: ${barberId})`);
        console.log(`   - Shiny Wheels (ID: ${carwashId})`);
        console.log(`   - Town Spaza (ID: ${spazaId})`);

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
        });
    }
}

// Run seeding
seedDatabase();

