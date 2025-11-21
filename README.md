# CSonic - WhatsApp Business Bot System

A full-stack, modular WhatsApp Business Bot platform designed for small businesses in South Africa. CSonic supports multiple business types with AI-powered customer support, multi-language capabilities, and comprehensive booking/order management.

## Features

- 🤖 **Modular Bot System** - Support for Barber Shops, Car Washes, and Spaza Shops
- 💬 **WhatsApp Cloud API Integration** - Send and receive messages seamlessly
- 🧠 **AI-Powered Support** - Auto-answer FAQs and provide personalized responses
- 🌍 **Multi-Language** - English, Afrikaans, Xhosa, Zulu, Sotho
- 📅 **Booking Management** - Handle appointments and reservations
- 🛒 **Order Management** - Process orders for spaza shops
- 📢 **Broadcast Messages** - Send promotions and announcements
- 📊 **Admin Dashboard** - Manage businesses, bookings, and messages

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your WhatsApp Cloud API credentials:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- `WHATSAPP_TOKEN` - From Meta Business Suite
- `PHONE_NUMBER_ID` - Your WhatsApp Business Phone Number ID
- `VERIFY_TOKEN` - A random string for webhook verification

### 3. Initialize Database

```bash
npm run init-db
```

### 4. Seed Test Data

```bash
npm run seed
```

This creates three example businesses:
- **Fresh Cuts Barbers** (Barber Shop)
- **Shiny Wheels** (Car Wash)
- **Town Spaza** (Spaza Shop)

### 5. Start the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The server will run on `http://localhost:3000`

### 6. Access Admin Dashboard

Open `http://localhost:3000/admin` in your browser.

## WhatsApp Webhook Setup

### 1. Set Webhook URL

In Meta Business Suite, set your webhook URL to:
```
https://your-domain.com/webhook/whatsapp
```

### 2. Verify Token

Use the same `VERIFY_TOKEN` from your `.env` file.

### 3. Subscribe to Messages

Subscribe to `messages` events in the webhook settings.

## Project Structure

```
csonic-bot/
├── modules/           # Business-specific modules
│   ├── generic.js    # Core functions for all businesses
│   ├── barber.js     # Barber shop features
│   ├── carwash.js    # Car wash features
│   ├── spaza.js      # Spaza shop features
│   ├── booking.js    # Shared booking logic
│   └── products.js   # Shared product/order logic
├── routes/           # API routes
│   ├── whatsapp.js   # WhatsApp webhook handler
│   └── business.js   # Business management API
├── services/         # Core services
│   ├── messageParser.js  # Message parsing and routing
│   ├── bookingService.js # Booking management
│   └── aiService.js      # AI response generation
├── database/         # Database files
│   ├── init.js       # Database initialization
│   ├── seed.js       # Test data seeding
│   ├── schema.sql    # Database schema
│   └── businesses.db # SQLite database (created on init)
├── dashboard/        # Admin dashboard
│   ├── index.html    # Dashboard HTML
│   ├── app.js        # Dashboard JavaScript
│   └── styles.css    # Dashboard styles
├── app.js            # Main Express application
└── README.md         # This file
```

## API Endpoints

### WhatsApp Webhook
- `POST /webhook/whatsapp` - Receive WhatsApp messages
- `GET /webhook/whatsapp` - Webhook verification

### Business API
- `GET /api/businesses` - List all businesses
- `GET /api/businesses/:id` - Get business details
- `POST /api/businesses` - Create new business
- `PUT /api/businesses/:id` - Update business
- `DELETE /api/businesses/:id` - Delete business

### Bookings API
- `GET /api/bookings` - List bookings (with filters)
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Messages API
- `GET /api/messages` - List messages
- `POST /api/messages/send` - Send message
- `POST /api/messages/broadcast` - Send broadcast

## Adding New Business Types

1. Create a new module in `modules/` (e.g., `restaurant.js`)
2. Implement required functions:
   - `handleMessage(business, message, customer)`
   - `getMenu()` or equivalent
   - Business-specific logic
3. Register the module in `services/messageParser.js`
4. Add business type to database schema if needed

## Multi-Language Support

CSonic supports 5 languages:
- English (en)
- Afrikaans (af)
- Xhosa (xh)
- Zulu (zu)
- Sotho (st)

Language is detected from customer messages or can be set per business.

## AI Features

The AI service provides:
- FAQ auto-answering based on business rules
- Context-aware responses
- Personalized greetings
- Business-specific knowledge

## Testing Without WhatsApp

You can test the system using the admin dashboard or by sending POST requests to `/api/messages/send` with:
```json
{
  "to": "+27123456789",
  "message": "Hello",
  "businessId": 1
}
```

## License

MIT

## Support

For issues and questions, please check the code comments or create an issue in the repository.

