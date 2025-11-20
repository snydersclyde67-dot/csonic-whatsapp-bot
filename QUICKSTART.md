# CSonic Quick Start Guide

## Installation & Setup (5 minutes)

### 1. Install Dependencies
```bash
cd csonic-bot
npm install
```

### 2. Configure Environment
Create a `.env` file in the `csonic-bot` directory:
```env
# WhatsApp Cloud API (Required for production, optional for testing)
WHATSAPP_ACCESS_TOKEN=your_token_here
WHATSAPP_PHONE_NUMBER_ID=your_number_id_here
WHATSAPP_VERIFY_TOKEN=your_verify_token_here
WHATSAPP_API_VERSION=v18.0

# Server
PORT=3000
NODE_ENV=development

# Database
DB_PATH=./database/businesses.db
```

**Note:** For testing without WhatsApp, you can skip the WhatsApp credentials. The system will work, but sending messages will fail.

### 3. Initialize Database
```bash
npm run init-db
```

### 4. Seed Test Data
```bash
npm run seed
```

This creates three example businesses:
- **Fresh Cuts Barbers** (Barber Shop) - ID: 1
- **Shiny Wheels** (Car Wash) - ID: 2  
- **Town Spaza** (Spaza Shop) - ID: 3

### 5. Start the Server
```bash
npm start
```

The server will start on `http://localhost:3000`

### 6. Access Dashboard
Open your browser and go to: `http://localhost:3000/dashboard`

## Testing Without WhatsApp

### Send a Test Message via API
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+27123456789",
    "message": "Hello, I want to book a haircut",
    "businessId": 1
  }'
```

### View Messages
- Go to Dashboard → Messages tab
- Messages are saved even without WhatsApp integration

## Using the Dashboard

### Manage Businesses
1. Go to **Businesses** tab
2. Click **+ Add Business** to create new businesses
3. Edit or delete existing businesses

### View Bookings
1. Go to **Bookings** tab
2. Filter by business or status
3. Confirm, cancel, or mark bookings as complete

### Manage Orders
1. Go to **Orders** tab
2. Select a business (required)
3. Update order status (pending → confirmed → ready → delivered)

### Send Broadcasts
1. Go to **Broadcasts** tab
2. Click **+ New Broadcast**
3. Select business and enter message
4. Click **Send Broadcast**

## Business Types Supported

### Barber Shop
- Services list with prices
- Booking system
- Appointment management
- Operating hours

### Car Wash
- Service packages
- Queue status
- Booking system
- Walk-in support

### Spaza Shop
- Product catalog
- Stock management
- Order processing
- Pickup/delivery options

## Adding New Business Types

1. Create a new module in `modules/` (e.g., `restaurant.js`)
2. Implement `handleMessage(business, customer, messageText)` function
3. Register in `services/messageParser.js`:
   ```javascript
   const businessModules = {
       barber: barberModule,
       carwash: carwashModule,
       spaza: spazaModule,
       restaurant: restaurantModule  // Add here
   };
   ```

## WhatsApp Webhook Setup (Production)

### 1. Get WhatsApp Credentials
- Go to Meta Business Suite
- Create a WhatsApp Business Account
- Get your Access Token and Phone Number ID

### 2. Set Webhook URL
```
https://your-domain.com/webhook/whatsapp
```

### 3. Verify Token
Use the same `WHATSAPP_VERIFY_TOKEN` from your `.env` file

### 4. Subscribe to Events
Subscribe to `messages` events in webhook settings

## Troubleshooting

### Database Errors
- Make sure you ran `npm run init-db` first
- Check that `DB_PATH` in `.env` is correct

### WhatsApp Not Working
- Verify credentials in `.env`
- Check webhook URL is accessible
- Test with `/api/messages/send` endpoint first

### Dashboard Not Loading
- Make sure server is running on port 3000
- Check browser console for errors
- Verify API endpoints are accessible

## Next Steps

1. **Customize AI Responses**: Edit FAQ rules in the database or via dashboard
2. **Add More Languages**: Update language files in modules
3. **Integrate Payment**: Add payment gateway for bookings/orders
4. **Analytics**: Add tracking and reporting features
5. **Notifications**: Set up email/SMS notifications for bookings

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review code comments in modules
- Test with the provided seed data first

Happy building! 🚀

