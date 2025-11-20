/**
 * AI Service
 * Provides AI-powered responses based on FAQ rules and business context
 */

const db = require('../database/db');
const { getGreeting } = require('../modules/generic');

/**
 * Get AI response based on FAQ rules
 */
async function getAIResponse(business, customer, messageText) {
    // Check if AI is enabled for this business
    if (!business.ai_enabled) {
        return null;
    }

    const language = customer?.language || business.language || 'en';
    const text = messageText.toLowerCase();

    // Get FAQ rules for this business
    const faqRules = await new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM faq_rules 
             WHERE business_id = ? AND (language = ? OR language = 'en')
             ORDER BY priority DESC, language DESC`,
            [business.id, language],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });

    // Check each FAQ rule
    for (const rule of faqRules) {
        const pattern = rule.question_pattern.toLowerCase();
        
        // Simple pattern matching - in production, use NLP or regex
        if (pattern.includes('|')) {
            // Multiple keywords separated by |
            const keywords = pattern.split('|').map(k => k.trim());
            if (keywords.some(keyword => text.includes(keyword))) {
                return rule.answer;
            }
        } else if (text.includes(pattern)) {
            return rule.answer;
        }
    }

    // Default responses for common queries
    if (text.includes('hello') || text.includes('hi') || text.includes('greetings') || 
        text.includes('hallo') || text.includes('molo') || text.includes('sawubona') || 
        text.includes('dumela')) {
        return getGreeting(business, customer);
    }

    if (text.includes('help') || text.includes('assist') || text.includes('support')) {
        return getHelpMessage(business, language);
    }

    if (text.includes('thank') || text.includes('thanks') || text.includes('dankie') || 
        text.includes('enkosi') || text.includes('ngiyabonga') || text.includes('kea leboha')) {
        return getThankYouMessage(language);
    }

    // No match found
    return null;
}

/**
 * Get help message
 */
function getHelpMessage(business, language) {
    const messages = {
        en: {
            barber: `Here's what I can help you with:\n\n• View services and prices - reply "services"\n• Book an appointment - reply "book [service] [date] [time]"\n• View operating hours - reply "hours"\n• Cancel booking - reply "cancel"\n\nNeed more help? Just ask!`,
            carwash: `Here's what I can help you with:\n\n• View services and prices - reply "services"\n• Check queue status - reply "queue"\n• Book a slot - reply "book [service] [date] [time]"\n• View operating hours - reply "hours"\n\nNeed more help? Just ask!`,
            spaza: `Here's what I can help you with:\n\n• View products and prices - reply "menu"\n• Place an order - reply "order [items]"\n• Check stock - reply "stock [product]"\n• Delivery info - reply "delivery"\n• View operating hours - reply "hours"\n\nNeed more help? Just ask!`
        },
        af: {
            barber: `Hier is wat ek kan help:\n\n• Bekyk dienste en pryse\n• Bespreek \'n afspraak\n• Bekyk bedryfstye\n• Kanselleer bespreking`,
            carwash: `Hier is wat ek kan help:\n\n• Bekyk dienste\n• Kyk wagtou status\n• Bespreek \'n slot`,
            spaza: `Hier is wat ek kan help:\n\n• Bekyk produkte\n• Plaas bestelling\n• Kyk voorraad`
        },
        xh: {
            barber: `Nantoni endinoku kunceda ngayo:\n\n• Jonga iinkonzo nemali\n• Bhukisha umhlathi\n• Jonga iiyure zokusebenza`,
            carwash: `Nantoni endinoku kunceda ngayo:\n\n• Jonga iinkonzo\n• Jonga imeko yejanjane`,
            spaza: `Nantoni endinoku kunceda ngayo:\n\n• Jonga iimveliso\n• Beka umyalelo`
        },
        zu: {
            barber: `Yilokho engingakusiza ngakho:\n\n• Bona izinsiza namaphrizisi\n• Buka isikhathi\n• Buka amahora okusebenza`,
            carwash: `Yilokho engingakusiza ngakho:\n\n• Bona izinsiza\n• Buka isimo sejanjane`,
            spaza: `Yilokho engingakusiza ngakho:\n\n• Bona imikhiqizo\n• Beka i-oda`
        },
        st: {
            barber: `Ke tseo nka u thusang ka tsona:\n\n• Bona litšebeletso le theko\n• Buka nako\n• Bona lihora tsa tshebetso`,
            carwash: `Ke tseo nka u thusang ka tsona:\n\n• Bona litšebeletso\n• Buka boemo ba lethathamo`,
            spaza: `Ke tseo nka u thusang ka tsona:\n\n• Bona lihlahisoa\n• Beka taelo`
        }
    };

    const langMessages = messages[language] || messages.en;
    return langMessages[business.type] || langMessages.barber || 'How can I help you today?';
}

/**
 * Get thank you message
 */
function getThankYouMessage(language) {
    const messages = {
        en: 'You\'re welcome! Is there anything else I can help you with?',
        af: 'Dis \'n plesier! Is daar nog iets waarmee ek kan help?',
        xh: 'Wamkelekile! Ingaba kukho enye into endinoku kunceda ngayo?',
        zu: 'Wamukelekile! Ingabe kukhona enye into engingakusiza ngayo?',
        st: 'O amohetse! Na ho na le tse ling tseo nka u thusang ka tsona?'
    };

    return messages[language] || messages.en;
}

/**
 * Train AI with new FAQ rule
 */
async function addFAQRule(businessId, questionPattern, answer, language = 'en', priority = 0) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO faq_rules (business_id, question_pattern, answer, language, priority)
             VALUES (?, ?, ?, ?, ?)`,
            [businessId, questionPattern, answer, language, priority],
            function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, success: true });
            }
        );
    });
}

/**
 * Get all FAQ rules for a business
 */
async function getFAQRules(businessId) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM faq_rules WHERE business_id = ? ORDER BY priority DESC, language`,
            [businessId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });
}

module.exports = {
    getAIResponse,
    getHelpMessage,
    addFAQRule,
    getFAQRules
};

