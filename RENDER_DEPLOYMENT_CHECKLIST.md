# Render Deployment Checklist for CSonic WhatsApp Bot

## 📋 Pre-Deployment Summary

**Deployment Folder:** Project root (`/`) - **NOT** the `whatsapp-render` folder  
**Start Script:** `npm start` (runs `node server.js`)  
**Main Server File:** `server.js`  
**Webhook Endpoint:** `/webhook` (GET for verification, POST for messages)

---

## ✅ Step 1: Render Service Configuration

### Service Settings
- **Service Type:** Web Service
- **Root Directory:** `.` (project root)
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment:** Node
- **Node Version:** 18
- **Plan:** Free (or your preferred plan)
- **Region:** Frankfurt (or your preferred region)
- **Auto Deploy:** Enabled (optional)

### ⚠️ Important Notes
- **DO NOT** deploy the `whatsapp-render` folder
- The `whatsapp-render` folder is ignored via `.gitignore` and will NOT affect deployment
- Deploy from the **project root** directory
- The `render.yaml` file is already configured correctly with `rootDir: .`

---

## 🔐 Step 2: Required Environment Variables

You **MUST** set these environment variables in Render Dashboard → Environment:

### Required Variables

| Variable Name | Description | Example/Notes |
|--------------|-------------|---------------|
| `WHATSAPP_TOKEN` | Your WhatsApp Cloud API access token | Get from Meta Business Suite |
| `PHONE_NUMBER_ID` | Your WhatsApp Business Phone Number ID | Get from Meta Business Suite |
| `VERIFY_TOKEN` | Custom token for webhook verification | Use a secure random string (e.g., `csonic-verify-token-2024`) |
| `PORT` | Server port (usually auto-set by Render) | Render sets this automatically, but you can set to `10000` |
| `NODE_ENV` | Environment mode | Set to `production` |
| `DB_PATH` | SQLite database file path | `./database/businesses.db` |

### Optional Variables

| Variable Name | Description | Default |
|--------------|-------------|---------|
| `WHATSAPP_API_VERSION` | WhatsApp API version | `v18.0` |
| `OPENAI_API_KEY` | OpenAI API key (if using AI features) | (empty) |

### 🔒 Security Notes
- **NEVER** commit `.env` files to Git
- Use Render's secure environment variable storage
- Keep `npm install express body-parser cors dotenv sqlite3 axios
VERIFY_TOKEN` secret and consistent between Meta and Render
- Remove any sensitive tokens from `env.example` before committing

---

## 🌐 Step 3: Meta WhatsApp Webhook Configuration

### 3.1 Get Your Render Webhook URL

After deployment, Render will provide a URL like:
```
https://csonic-bot-api.onrender.com
```

Your webhook endpoint will be:
```
https://csonic-bot-api.onrender.com/webhook
```

### 3.2 Configure Webhook in Meta Dashboard

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your WhatsApp Business App
3. Navigate to **WhatsApp → Configuration**
4. Click **Edit** next to "Webhook"
5. Enter your webhook URL: `https://your-app.onrender.com/webhook`
6. Enter your **Verify Token** (must match the `VERIFY_TOKEN` environment variable)
7. Click **Verify and Save**

### 3.3 Subscribe to Webhook Fields

In the Meta Dashboard, subscribe to these webhook fields:
- ✅ `messages`
- ✅ `message_status`

---

## 🧪 Step 4: Testing the Deployment

### 4.1 Test Webhook Verification (GET)

**Using Meta Dashboard:**
1. Go to Meta Dashboard → WhatsApp → Configuration
2. Click **Test** next to your webhook
3. Meta will send a GET request to verify the webhook
4. You should see "Webhook verified" in your Render logs

**Manual Test (using curl):**
```bash
curl "https://your-app.onrender.com/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"
```

Expected response: `test123` (the challenge string)

### 4.2 Test Message Handling (POST) - Using "Test Event"

**Using Meta Dashboard "Test Event":**
1. Go to Meta Dashboard → WhatsApp → Configuration
2. Click **Send test message** or **Test Event** button
3. Select a test phone number (must be added to your Meta app's test numbers)
4. Send a test message (e.g., "Hello")
5. Check Render logs for:
   - `Received message from [phone]: [message]`
   - `Reply sent to [phone]`
   - Any error messages

**Check Server Health:**
```bash
curl https://your-app.onrender.com/
```

Expected response:
```json
{
  "status": "CSonic WhatsApp bot is running.",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 4.3 Test from WhatsApp

1. Add your phone number as a test number in Meta Dashboard
2. Send a WhatsApp message to your business number
3. You should receive an automated response
4. Check Render logs for message processing

---

## 📊 Step 5: Monitoring & Logs

### View Logs in Render
1. Go to Render Dashboard → Your Service → Logs
2. Look for:
   - `✅ CSonic WhatsApp Bot Server Started Successfully`
   - `📍 Server listening on port [PORT]`
   - `📱 Webhook endpoint: http://localhost:[PORT]/webhook`
   - Message processing logs

### Common Issues

| Issue | Solution |
|-------|----------|
| Webhook verification fails | Check `VERIFY_TOKEN` matches in both Meta and Render |
| 403 Forbidden on webhook | Verify token mismatch |
| Messages not received | Check webhook subscription in Meta Dashboard |
| Server crashes | Check logs for database errors, ensure DB_PATH is correct |
| Port binding errors | Render sets PORT automatically, don't override |
| Database errors | Ensure database directory exists and is writable |

---

## 🗄️ Step 6: Database Setup

### Automatic Database Creation

The database connection is initialized automatically when the server starts. The database file will be created at the path specified in `DB_PATH` environment variable.

**Important:** Database scripts (`init.js`, `migrate.js`, `seed.js`) do **NOT** auto-run on server startup. They only run when manually executed.

### Manual Database Setup (if needed)

If you need to manually initialize or migrate the database:

1. Connect to your Render service via SSH (if available) or use a one-off command
2. Run migration:
   ```bash
   npm run migrate
   ```
3. (Optional) Seed initial data:
   ```bash
   npm run seed
   ```

**Note:** The database file (`businesses.db`) is stored in the Render filesystem and will persist between deployments, but may be lost if you delete the service.

---

## 📝 Step 7: Final Verification Checklist

Before going live, verify:

- [ ] Render service is deployed and running
- [ ] All environment variables are set correctly in Render Dashboard
- [ ] Webhook URL is configured in Meta Dashboard
- [ ] Webhook verification test passes (GET request)
- [ ] Test message from Meta Dashboard "Test Event" works (POST request)
- [ ] Server logs show successful startup
- [ ] Health check endpoint (`/`) returns success
- [ ] WhatsApp messages are received and processed
- [ ] Bot responses are sent successfully
- [ ] Database is accessible and working

---

## 🔄 Step 8: Deployment Workflow

### Initial Deployment
1. Push code to your Git repository (main branch)
2. Connect repository to Render
3. Render will auto-deploy (if enabled)
4. Set environment variables in Render Dashboard
5. Configure webhook in Meta Dashboard
6. Test webhook verification using Meta Dashboard
7. Test with "Test Event" feature in Meta Dashboard
8. Test with a real WhatsApp message

### Updates/Re-deployment
1. Push changes to Git
2. Render auto-deploys (or manually trigger)
3. Webhook configuration persists (no need to reconfigure)
4. Test after deployment

---

## 📞 Support & Troubleshooting

### Render Dashboard
- **Service URL:** Check your service URL in Render Dashboard
- **Logs:** Always check logs first for errors
- **Metrics:** Monitor CPU, memory, and response times
- **Environment Variables:** Verify all required variables are set

### Meta Dashboard
- **Webhook Status:** Check webhook status in Meta Dashboard
- **Test Events:** Use "Test Event" feature to debug webhook issues
- **API Status:** Check Meta API status page
- **Test Numbers:** Ensure test phone numbers are added to your app

### Common Commands

```bash
# Check server health
curl https://your-app.onrender.com/

# Test webhook verification
curl "https://your-app.onrender.com/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"

# View API endpoints
curl https://your-app.onrender.com/api/businesses
```

---

## ✅ Deployment Complete!

Once all steps are complete, your CSonic WhatsApp bot should be:
- ✅ Running on Render (from project root)
- ✅ Receiving webhooks from Meta
- ✅ Processing WhatsApp messages
- ✅ Sending automated responses
- ✅ Ready for production use

---

## 📌 Quick Reference

**Deployment Folder:** Project root (`.`), NOT `whatsapp-render/`  
**Start Command:** `npm start`  
**Webhook Path:** `/webhook`  
**Health Check:** `/`  
**API Base:** `/api`  
**Admin Dashboard:** `/admin`

**Environment Variables Required:**
- `WHATSAPP_TOKEN`
- `PHONE_NUMBER_ID`
- `VERIFY_TOKEN`
- `PORT` (auto-set by Render)
- `NODE_ENV=production`
- `DB_PATH=./database/businesses.db`

---

**Last Updated:** 2024  
**Project:** CSonic WhatsApp Bot  
**Deployment Target:** Render.com  
**Status:** ✅ Cleaned and Ready for Deployment
