# WhatsApp Credentials Reference

**⚠️ KEEP THIS INFORMATION SECURE - DO NOT SHARE PUBLICLY**

## Current Configuration

- **Phone Number ID**: `864230316773330`
- **Access Token**: `EAA0TIpNTlEsBP3VA6F7d9JnYh9aN8TSBxa3ZBpOnqZAGxPuJsAtgYlzgTCnZB0PTZCZCPaKm2WHMHhpFFZCMGYxEm90kP9JmWaidYFQZALwzwLUwRvoQiwnGbQd2tvBirOIe9ZA1VAfZC27maiATnmeTNwRkJC69QQ7m0LvxZBhSscOeQJuRTt3ZCAF5QopijFfhmXS4kl2ZBlVSBDNqvN63nZCrbqP0xYZBrZAVNjKrl1qZCJSZCMHWLKqSrITmEguiEW3RpjLOzLfEytXXdZAGXLpBonLtXfLKrT`
- **Verify Token**: `csonic_verify_token_12345`
- **Test Number**: `+1 555 167 6535` (format for API: `+15551676535`)
- **WhatsApp Business Account ID**: `3150914015082872`

## Webhook Configuration

When setting up the webhook in Meta Business Suite:

- **Callback URL**: `https://your-domain.com/webhook/whatsapp`
  - For testing with ngrok: `https://your-ngrok-url.ngrok.io/webhook/whatsapp`
- **Verify Token**: `csonic_verify_token_12345`
- **Webhook Fields**: Subscribe to `messages`

## Important Notes

1. **Access Token Expiration**: This is a temporary token that expires in 24 hours. For production, get a permanent System User token.

2. **Phone Number Format**: When sending messages, use international format without spaces:
   - Correct: `+15551676535`
   - Wrong: `+1 555 167 6535` or `15551676535`

3. **Security**: 
   - Never commit `.env` file to Git
   - Keep access tokens secret
   - Rotate tokens periodically

## Testing

To test sending a message:

```powershell
curl -X POST http://localhost:3000/api/messages/send `
  -H "Content-Type: application/json" `
  -d '{\"to\": \"+15551676535\", \"message\": \"Hello from CSonic!\", \"businessId\": 1}'
```

## Updating Businesses

Make sure your businesses in the database have the correct WhatsApp number:

1. Go to Dashboard → Businesses
2. Edit each business
3. Set WhatsApp Number to: `+15551676535` (or your actual business number)
4. Save


