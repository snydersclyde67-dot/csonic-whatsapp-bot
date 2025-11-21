# WhatsApp Cloud API Setup Guide

Complete step-by-step instructions to connect CSonic with WhatsApp Business API.

## Prerequisites

- A Facebook account
- A Meta Business account (free to create)
- A domain name with HTTPS (for webhook - can use ngrok for testing)

---

## Step 1: Create Meta Business Account

1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Click **"Create Account"** or sign in
3. Follow the prompts to create your business account
4. Verify your email if required

---

## Step 2: Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **"My Apps"** in the top right
3. Click **"Create App"**
4. Select **"Business"** as the app type
5. Fill in:
   - **App Name**: CSonic Bot (or your preferred name)
   - **App Contact Email**: Your email
6. Click **"Create App"**

---

## Step 3: Add WhatsApp Product

1. In your app dashboard, find **"Add Products"** or go to **"Products"** in the left sidebar
2. Find **"WhatsApp"** and click **"Set Up"**
3. You'll be taken to the WhatsApp configuration page

---

## Step 4: Get Your Credentials

### A. Get Phone Number ID

1. In the WhatsApp section, go to **"API Setup"** tab
2. You'll see **"Phone number ID"** - **COPY THIS NUMBER**
   - It looks like: `123456789012345`
   - This is your `PHONE_NUMBER_ID`

### B. Get Access Token

1. Still in **"API Setup"** tab
2. Find **"Temporary access token"** section
3. Click **"Generate token"** or copy the existing token
4. **COPY THIS TOKEN** (it's long, starts with something like `EAAB...`)
   - This is your `WHATSAPP_TOKEN`
   - ⚠️ **Note**: Temporary tokens expire in 24 hours. You'll need a permanent token (see Step 7)

### C. Set Webhook Verify Token

1. Go to **"Configuration"** tab in WhatsApp settings
2. Find **"Webhook"** section
3. Click **"Edit"** or **"Add Callback URL"**
4. You'll need:
   - **Callback URL**: `https://your-domain.com/webhook/whatsapp` (we'll set this up)
   - **Verify Token**: Create a random string (e.g., `csonic_verify_token_12345`)
   - **COPY THE VERIFY TOKEN** you create

---

## Step 5: Update Your .env File

Open `csonic-bot/.env` and update these values:

```env
WHATSAPP_TOKEN=EAABwzLixnjYBO7... (your token here)
PHONE_NUMBER_ID=123456789012345 (your phone number ID)
VERIFY_TOKEN=csonic_verify_token_12345 (the token you created)
WHATSAPP_API_VERSION=v18.0
```

**Save the file.**

---

## Step 6: Set Up Webhook (For Testing - Using ngrok)

If you don't have a public domain yet, use ngrok for testing:

### Install ngrok:
1. Download from [ngrok.com](https://ngrok.com/download)
2. Extract and add to your PATH, or use the full path

### Start your CSonic server:
```powershell
cd csonic-bot
npm start
```

### In a new terminal, start ngrok:
```powershell
ngrok http 3000
```

### Copy the HTTPS URL:
- You'll see something like: `https://abc123.ngrok.io`
- **Copy this URL**

---

## Step 7: Configure Webhook in Meta

1. Go back to Meta for Developers → Your App → WhatsApp → Configuration
2. In the **"Webhook"** section, click **"Edit"**
3. Enter:
   - **Callback URL**: `https://your-ngrok-url.ngrok.io/webhook/whatsapp`
     - Or your production domain: `https://yourdomain.com/webhook/whatsapp`
   - **Verify Token**: The same token you put in `.env` file
4. Click **"Verify and Save"**
   - Meta will send a GET request to verify
   - If successful, you'll see a green checkmark ✅

5. **Subscribe to Webhook Fields**:
   - Click **"Manage"** next to Webhook
   - Check the box for **"messages"**
   - Click **"Save"**

---

## Step 8: Get Permanent Access Token (Important!)

Temporary tokens expire in 24 hours. Get a permanent one:

### Option A: System User Token (Recommended for Production)

1. Go to **"WhatsApp"** → **"API Setup"**
2. Scroll to **"Access Tokens"**
3. Click **"Add or manage System Users"**
4. Create a System User (if you don't have one)
5. Generate a token for the System User
6. Select permissions: `whatsapp_business_messaging`, `whatsapp_business_management`
7. **Copy the permanent token** and update your `.env` file

### Option B: Use App Token (For Development)

1. Go to **"WhatsApp"** → **"API Setup"**
2. Under **"Temporary access token"**, you can regenerate as needed
3. For production, use System User token (Option A)

---

## Step 9: Add a Phone Number (If Needed)

If you don't have a WhatsApp Business phone number:

1. Go to **"WhatsApp"** → **"Phone Numbers"**
2. Click **"Add Phone Number"**
3. Follow the verification process:
   - Enter your phone number
   - Receive verification code via SMS/Call
   - Enter the code
4. Once verified, this number will be your WhatsApp Business number

---

## Step 10: Test the Connection

### Test 1: Send a Test Message via API

```powershell
# Test sending a message
curl -X POST http://localhost:3000/api/messages/send `
  -H "Content-Type: application/json" `
  -d '{\"to\": \"+27123456789\", \"message\": \"Hello from CSonic!\", \"businessId\": 1}'
```

Replace `+27123456789` with a real WhatsApp number (include country code).

### Test 2: Send a Message from WhatsApp

1. Open WhatsApp on your phone
2. Send a message to your WhatsApp Business number
3. Check your server logs - you should see the incoming message
4. The bot should automatically reply

### Test 3: Check Dashboard

1. Go to `http://localhost:3000/dashboard`
2. Click **"Messages"** tab
3. You should see incoming and outgoing messages

---

## Step 11: Link Business to WhatsApp Number

In your CSonic dashboard:

1. Go to **"Businesses"** tab
2. Edit a business (or create new)
3. Set **"WhatsApp Number"** to your WhatsApp Business number
4. Save

Now when customers message that number, CSonic will handle it!

---

## Troubleshooting

### Webhook Verification Fails

- ✅ Make sure your server is running
- ✅ Check ngrok is running (if using)
- ✅ Verify the URL is correct: `https://your-url/webhook/whatsapp`
- ✅ Check the verify token matches in both Meta and `.env`
- ✅ Make sure your server is accessible from the internet

### Messages Not Received

- ✅ Check webhook is subscribed to "messages" events
- ✅ Verify phone number ID is correct
- ✅ Check access token hasn't expired
- ✅ Look at server logs for errors
- ✅ Make sure the business WhatsApp number is set correctly

### Can't Send Messages

- ✅ Verify access token is valid
- ✅ Check phone number ID is correct
- ✅ Make sure the recipient number is in correct format: `+27123456789`
- ✅ Check you're not rate-limited (WhatsApp has limits)

### Common Errors

**"Invalid OAuth access token"**
- Token expired or incorrect
- Regenerate token in Meta Business Suite

**"Phone number not found"**
- Phone number ID is wrong
- Check in Meta Business Suite → WhatsApp → API Setup

**"Webhook verification failed"**
- Verify token mismatch
- Server not accessible
- URL incorrect

---

## Production Deployment

For production, you'll need:

1. **Public Domain**: A domain with HTTPS (Let's Encrypt for free SSL)
2. **Permanent Token**: System User token (not temporary)
3. **Server**: Deploy to VPS (DigitalOcean, AWS, etc.) or cloud platform
4. **Process Manager**: Use PM2 to keep server running
   ```bash
   npm install -g pm2
   pm2 start app.js --name csonic
   ```

---

## Security Notes

- ⚠️ **Never commit `.env` file to Git** (it's in .gitignore)
- ⚠️ **Keep your access token secret**
- ⚠️ **Use environment variables in production**
- ⚠️ **Rotate tokens periodically**

---

## Next Steps

Once WhatsApp is connected:

1. ✅ Test sending/receiving messages
2. ✅ Configure business-specific responses
3. ✅ Set up FAQ rules in dashboard
4. ✅ Test booking/order flows
5. ✅ Set up broadcast messaging
6. ✅ Monitor message logs in dashboard

---

## Support Resources

- [Meta Business Suite](https://business.facebook.com/)
- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Webhook Setup Guide](https://developers.facebook.com/docs/graph-api/webhooks)

---

**Need Help?** Check server logs and Meta Business Suite error messages for specific issues.


