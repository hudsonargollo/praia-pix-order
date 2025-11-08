# Baileys WhatsApp Setup Guide

## What is Baileys?

Baileys is a WhatsApp Web API that allows your application to send messages through WhatsApp without needing the official WhatsApp Business API. It works by connecting to WhatsApp Web, just like you would on your computer.

## Prerequisites

- ✅ A phone number with WhatsApp installed
- ✅ Preferably a WhatsApp Business account (but regular WhatsApp works too)
- ✅ The phone must have internet connection
- ✅ Database setup completed (you've already done this!)

## Setup Steps

### Step 1: Access WhatsApp Admin Panel

1. Open your deployed application
2. Navigate to `/whatsapp-admin`
3. You should see the WhatsApp Admin interface

**URL Examples:**
- Production: `https://coco-loko-acaiteria.pages.dev/whatsapp-admin`
- Local: `http://localhost:8080/whatsapp-admin`

### Step 2: Connect WhatsApp

1. **Click "Connect WhatsApp" button**
   - A QR code will appear on the screen
   - The QR code refreshes every 60 seconds

2. **Scan QR Code with Your Phone**
   - Open WhatsApp on your phone
   - Go to **Settings** → **Linked Devices** (or **WhatsApp Web**)
   - Tap **"Link a Device"**
   - Scan the QR code displayed on your screen

3. **Wait for Connection**
   - Status will change from "Connecting..." to "Connected"
   - You'll see a green checkmark ✅
   - Connection details will be displayed

### Step 3: Verify Connection

Once connected, you should see:
- ✅ **Status**: Connected
- 📱 **Phone Number**: Your WhatsApp number
- 🔗 **Session ID**: Unique identifier
- ⏰ **Connected At**: Timestamp

### Step 4: Test Notification

1. **Create a Test Order**
   - Go to `/menu`
   - Add items to cart
   - Complete checkout with a valid phone number

2. **Mark Order as Paid** (in Supabase SQL Editor):
   ```sql
   UPDATE orders
   SET status = 'paid',
       payment_confirmed_at = NOW()
   WHERE order_number = YOUR_ORDER_NUMBER;
   ```

3. **Check Notification**
   - Go back to `/whatsapp-admin`
   - Click "Notification History" tab
   - You should see the notification in the list
   - Check your WhatsApp to verify message was received

## Important Notes

### Connection Persistence

✅ **Good News**: The connection persists even if you:
- Close the browser tab
- Refresh the page
- Restart your computer

❌ **Connection Lost If**:
- You log out of WhatsApp Web on your phone
- You delete the linked device from WhatsApp
- Session expires (rare, usually lasts weeks/months)

### Reconnection

If connection is lost:
1. Go to `/whatsapp-admin`
2. Click "Connect WhatsApp" again
3. Scan new QR code
4. Connection restored!

### Production Deployment

For 24/7 operation, you have two options:

#### Option 1: Browser-Based (Simple)
- Keep a browser tab open on a computer/server
- Use a tool like `screen` or `tmux` on a Linux server
- Or use a dedicated computer that stays on

#### Option 2: Server-Based (Advanced)
- Deploy Baileys connection to a Node.js server
- Use PM2 or similar to keep it running
- More reliable for production use

## Troubleshooting

### QR Code Not Appearing

**Check 1**: Verify you're on the correct page
- URL should end with `/whatsapp-admin`

**Check 2**: Check browser console for errors
- Press F12 to open developer tools
- Look for error messages in Console tab

**Check 3**: Verify Cloudflare Functions are working
- Check `/api/whatsapp/connection` endpoint
- Should return connection status

### "Connection Failed" Error

**Solution 1**: Refresh and try again
- Click "Disconnect" if button is available
- Click "Connect WhatsApp" again
- Scan new QR code

**Solution 2**: Check phone internet connection
- Ensure phone has stable internet
- Try switching between WiFi and mobile data

**Solution 3**: Clear WhatsApp Web sessions
- On phone: Settings → Linked Devices
- Remove all linked devices
- Try connecting again

### Messages Not Sending

**Check 1**: Verify connection status
- Go to `/whatsapp-admin`
- Status should show "Connected"

**Check 2**: Check notification queue
```sql
SELECT * FROM whatsapp_notifications
WHERE status = 'pending'
ORDER BY created_at DESC;
```

**Check 3**: Check error logs
```sql
SELECT * FROM whatsapp_error_logs
ORDER BY created_at DESC
LIMIT 10;
```

**Check 4**: Verify phone number format
- Must be: `+5573999999999`
- Includes country code (+55)
- No spaces or special characters

### "Rate Limit" Errors

WhatsApp has rate limits to prevent spam:
- **Solution**: System automatically handles rate limiting
- Messages are queued and sent with delays
- Check notification history for delivery status

## Best Practices

### 1. Use WhatsApp Business

Benefits:
- More professional appearance
- Business profile with description
- Better for customer communication
- Same setup process as regular WhatsApp

### 2. Dedicated Phone Number

Recommendations:
- Use a separate phone number for the business
- Don't use your personal WhatsApp
- Consider a dedicated device/SIM card

### 3. Monitor Regularly

Check daily:
- Connection status at `/whatsapp-admin`
- Notification delivery rates
- Error logs for issues

### 4. Backup Session

The session is stored in Supabase:
- Table: `whatsapp_sessions`
- Automatically backed up with your database
- Can be restored if needed

### 5. Customer Communication

Inform customers:
- They'll receive WhatsApp notifications
- Messages come from your business number
- They can reply (though system doesn't handle replies yet)

## Security Considerations

### ✅ What's Secure

- Session data is encrypted in database
- Phone numbers are validated before sending
- Rate limiting prevents abuse
- Opt-out functionality available

### ⚠️ Important

- Don't share your QR code with anyone
- Keep your phone secure
- Monitor for unauthorized access
- Regularly check linked devices in WhatsApp

## Testing Checklist

Before going live, test:

- [ ] QR code appears and can be scanned
- [ ] Connection status shows "Connected"
- [ ] Test notification sends successfully
- [ ] Customer receives message on WhatsApp
- [ ] Message includes correct order details
- [ ] Connection persists after page refresh
- [ ] Reconnection works if disconnected
- [ ] Error handling works properly

## Production Checklist

- [ ] WhatsApp Business account set up
- [ ] Dedicated phone number configured
- [ ] Connection tested and verified
- [ ] Notification templates customized
- [ ] Staff trained on reconnection process
- [ ] Monitoring set up for connection status
- [ ] Backup plan for WhatsApp downtime
- [ ] Customer communication prepared

## Support & Maintenance

### Daily Tasks
- Check connection status
- Review notification delivery
- Monitor error logs

### Weekly Tasks
- Review notification templates
- Check customer feedback
- Update templates if needed

### Monthly Tasks
- Analyze notification metrics
- Review and optimize templates
- Check for Baileys updates

## Advanced: Server Deployment

For production 24/7 operation, consider deploying to a server:

### Option 1: VPS (DigitalOcean, Linode, etc.)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your project
git clone your-repo
cd your-project

# Install dependencies
npm install

# Start with PM2
npm install -g pm2
pm2 start npm --name "whatsapp-bot" -- start
pm2 save
pm2 startup
```

### Option 2: Docker Container

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
```

### Option 3: Dedicated Raspberry Pi

- Low cost (~$50)
- Low power consumption
- Always on
- Perfect for small businesses

## FAQ

**Q: Can I use my personal WhatsApp?**
A: Yes, but it's better to use a separate business number.

**Q: How long does the connection last?**
A: Usually weeks to months. Reconnect if it drops.

**Q: Can customers reply to messages?**
A: They can reply, but the system doesn't process replies yet.

**Q: Is this legal?**
A: Yes, Baileys uses WhatsApp Web protocol, which is allowed for personal/business use.

**Q: What if WhatsApp blocks my number?**
A: Follow rate limits, don't spam, and use WhatsApp Business to reduce risk.

**Q: Can I send images/files?**
A: The current setup sends text only. Can be extended for media.

**Q: How many messages can I send per day?**
A: No official limit, but stay reasonable (hundreds, not thousands per day).

## Next Steps

1. ✅ Connect your WhatsApp
2. ✅ Send a test notification
3. ✅ Verify customer receives it
4. ✅ Monitor for a few days
5. ✅ Go live with confidence!

Need help? Check the error logs in Supabase or review the browser console for detailed error messages.
