/**
 * Bot Registry
 * Central place to register and introspect the available business bot modules.
 */

const registry = new Map();

function registerBot(type, handler, meta = {}) {
    if (!handler) {
        throw new Error(`Cannot register bot "${type}" without a handler module`);
    }
    registry.set(type, {
        type,
        handler,
        meta: {
            name: meta.name || `${type.charAt(0).toUpperCase()}${type.slice(1)} Bot`,
            description: meta.description || 'No description provided',
            commands: meta.commands || []
        }
    });
}

function getBotHandler(type) {
    return registry.get(type)?.handler || null;
}

function listBots() {
    return Array.from(registry.values()).map(bot => ({
        type: bot.type,
        name: bot.meta.name,
        description: bot.meta.description,
        commands: bot.meta.commands
    }));
}

// Register built-in bot modules
registerBot('barber', require('../modules/barber'), {
    name: 'Barber Bot',
    description: 'Helps barber shops manage services, bookings, and operating hours.',
    commands: ['services', 'book', 'hours', 'cancel', 'my bookings']
});

registerBot('carwash', require('../modules/carwash'), {
    name: 'Car Wash Bot',
    description: 'Supports car wash queues, bookings, and price lists.',
    commands: ['services', 'queue', 'book', 'hours']
});

registerBot('spaza', require('../modules/spaza'), {
    name: 'Spaza Shop Bot',
    description: 'Handles menu, stock checks, and WhatsApp orders for spaza shops.',
    commands: ['menu', 'order', 'stock', 'delivery', 'hours']
});

module.exports = {
    registerBot,
    getBotHandler,
    listBots
};


