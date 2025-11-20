# Simple ngrok Setup - Step by Step

## Step 1: Find Your ngrok.exe File

1. Open File Explorer
2. Search for "ngrok.exe" in your computer
3. **Remember the folder path** where it's located
   - Common locations:
     - `C:\Users\Clyde Snyders\Downloads\ngrok.exe`
     - `C:\Users\Clyde Snyders\Desktop\ngrok.exe`
     - `C:\ngrok\ngrok.exe`

## Step 2: Start Your CSonic Server

1. Open PowerShell or Command Prompt
2. Type these commands one by one:

```powershell
cd "C:\Users\Clyde Snyders\OneDrive\Desktop\c.snyders.hub\csonic-bot"
npm start
```

3. **Keep this window open** - you should see:
   ```
   🚀 CSonic Bot Server is running!
   📱 WhatsApp Webhook: http://localhost:3000/webhook/whatsapp
   ```

## Step 3: Start ngrok (In a NEW Window)

1. Open a **NEW** PowerShell or Command Prompt window
2. Navigate to where ngrok.exe is located:

```powershell
# Example - replace with YOUR path:
cd "C:\Users\Clyde Snyders\Downloads"
```

3. Run ngrok:

```powershell
.\ngrok.exe http 3000
```

4. You'll see a screen with URLs - **COPY the HTTPS URL**
   - It looks like: `https://abc123def456.ngrok.io`
   - **This is your webhook URL!**

## Step 4: Configure Webhook in Meta

1. Go to: https://developers.facebook.com/
2. Click **"My Apps"** → Select your app
3. Click **"WhatsApp"** in the left menu
4. Click **"Configuration"** tab
5. Find **"Webhook"** section → Click **"Edit"**
6. Enter:
   - **Callback URL**: `https://YOUR-NGROK-URL.ngrok.io/webhook/whatsapp`
     - Replace `YOUR-NGROK-URL` with the URL from ngrok (e.g., `abc123def456`)
   - **Verify Token**: `csonic_verify_token_12345`
7. Click **"Verify and Save"** - should show ✅
8. Click **"Manage"** next to Webhook
9. Check the box for **"messages"**
10. Click **"Save"**

## Step 5: Test It!

1. Send a WhatsApp message to: `+1 555 167 6535`
2. Check your CSonic server window - you should see the message!
3. Check Dashboard: http://localhost:3000/dashboard → Messages tab

---

## Troubleshooting

**"ngrok not found"**
- Make sure you're in the correct folder where ngrok.exe is located
- Use the full path: `C:\path\to\ngrok.exe http 3000`

**"Server not running"**
- Make sure Step 2 is done - server must be running first
- Check port 3000 is not used by another app

**"Webhook verification failed"**
- Make sure server is running
- Make sure ngrok is running
- Check the URL is exactly: `https://YOUR-URL.ngrok.io/webhook/whatsapp`
- Check verify token matches: `csonic_verify_token_12345`

**"Can't see ngrok URL"**
- Look for the line that says "Forwarding" in ngrok window
- The HTTPS URL is what you need

---

## Quick Reference

- **CSonic Server**: `http://localhost:3000`
- **Dashboard**: `http://localhost:3000/dashboard`
- **Webhook Endpoint**: `/webhook/whatsapp`
- **Verify Token**: `csonic_verify_token_12345`


