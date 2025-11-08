# Complete Evolution API Setup on Google Cloud VM

## Step-by-Step Guide Using Cloud Shell

### Step 1: Create Firewall Rule (From Cloud Shell)

Copy and paste this command in the Cloud Shell terminal:

```bash
gcloud compute firewall-rules create allow-evolution-api \
    --allow tcp:8080 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow Evolution API on port 8080" \
    --direction INGRESS
```

Expected output: `Created firewall rule [allow-evolution-api]`

### Step 2: SSH into Your VM

```bash
gcloud compute ssh evoapi --zone=us-east1-d
```

If prompted:
- "Do you want to continue (Y/n)?" → Type `Y` and press Enter
- It may generate SSH keys automatically

### Step 3: Update System

Once connected to your VM, run:

```bash
sudo apt update && sudo apt upgrade -y
```

This takes 2-3 minutes. Wait for it to complete.

### Step 4: Install Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

Verify installation:

```bash
node --version
npm --version
```

Should show: `v18.x.x` and `10.x.x`

### Step 5: Clone Evolution API

```bash
git clone https://github.com/hudsonargollo/evolution-api.git
cd evolution-api
```

### Step 6: Install Dependencies

```bash
npm install
```

This takes 3-5 minutes. You'll see lots of output - this is normal.

### Step 7: Create Environment File

```bash
nano .env
```

Paste this configuration (right-click to paste in terminal):

```env
# Server Configuration
SERVER_URL=http://104.196.211.76:8080
PORT=8080

# Authentication
AUTHENTICATION_API_KEY=coco-loko-secret-2024

# Database
DATABASE_ENABLED=true
DATABASE_PROVIDER=sqlite
DATABASE_CONNECTION_CLIENT_NAME=evolution_db
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true

# Instance Settings
DEL_INSTANCE=false
DEL_TEMP_INSTANCES=false

# Logging
LOG_LEVEL=ERROR
LOG_COLOR=true
LOG_BAILEYS=error

# QR Code
QRCODE_LIMIT=30
QRCODE_COLOR=#198754

# Webhook (optional - for Coco Loko integration)
WEBHOOK_GLOBAL_ENABLED=false
WEBHOOK_GLOBAL_URL=https://your-coco-loko-site.pages.dev/api/whatsapp/webhook
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false

# Connection
CONNECTION_TIMEOUT=300000
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### Step 8: Configure Firewall on VM

```bash
sudo ufw allow 8080/tcp
sudo ufw allow 22/tcp
sudo ufw --force enable
sudo ufw status
```

Should show:
```
Status: active
To                         Action      From
--                         ------      ----
8080/tcp                   ALLOW       Anywhere
22/tcp                     ALLOW       Anywhere
```

### Step 9: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Step 10: Start Evolution API

```bash
pm2 start npm --name "evolution-api" -- start
```

Expected output:
```
[PM2] Starting npm in fork_mode (1 instance)
[PM2] Done.
```

### Step 11: Check Status

```bash
pm2 status
```

Should show:
```
┌─────┬──────────────────┬─────────┬─────────┬──────────┐
│ id  │ name             │ status  │ restart │ uptime   │
├─────┼──────────────────┼─────────┼─────────┼──────────┤
│ 0   │ evolution-api    │ online  │ 0       │ 0s       │
└─────┴──────────────────┴─────────┴─────────┴──────────┘
```

### Step 12: View Logs

```bash
pm2 logs evolution-api --lines 30
```

Look for:
```
Server started on port 8080
Evolution API is running
```

Press `Ctrl + C` to exit logs.

### Step 13: Save PM2 Configuration

```bash
pm2 save
```

### Step 14: Enable PM2 on Boot

```bash
pm2 startup
```

This will output a command like:
```
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u your-username --hp /home/your-username
```

**Copy that entire command and run it.**

### Step 15: Test Evolution API

From the VM terminal:

```bash
curl http://localhost:8080/instance/fetchInstances \
  -H "apikey: coco-loko-secret-2024"
```

Should return: `[]`

### Step 16: Test from Outside

Exit the VM SSH session:

```bash
exit
```

Now from Cloud Shell, test external access:

```bash
curl http://104.196.211.76:8080/instance/fetchInstances \
  -H "apikey: coco-loko-secret-2024"
```

Should return: `[]`

If you get a connection error, wait 30 seconds and try again.

### Step 17: Create Test Instance

```bash
curl -X POST http://104.196.211.76:8080/instance/create \
  -H "apikey: coco-loko-secret-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "coco-loko",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

Should return JSON with QR code data.

### Step 18: Get QR Code

```bash
curl http://104.196.211.76:8080/instance/connect/coco-loko \
  -H "apikey: coco-loko-secret-2024"
```

Should return QR code in base64 format.

---

## Troubleshooting

### If Evolution API won't start:

```bash
# SSH back into VM
gcloud compute ssh evoapi --zone=us-east1-d

# Check logs
cd evolution-api
pm2 logs evolution-api --lines 50

# Restart
pm2 restart evolution-api

# Check status
pm2 status
```

### If port 8080 is blocked:

```bash
# Check firewall rules
gcloud compute firewall-rules list | grep 8080

# If not found, create it again
gcloud compute firewall-rules create allow-evolution-api \
    --allow tcp:8080 \
    --source-ranges 0.0.0.0/0
```

### If you need to stop Evolution API:

```bash
pm2 stop evolution-api
```

### If you need to restart the VM:

```bash
gcloud compute instances stop evoapi --zone=us-east1-d
gcloud compute instances start evoapi --zone=us-east1-d
```

PM2 will automatically restart Evolution API on boot.

---

## Important Information

**Your Evolution API Details:**
- URL: `http://104.196.211.76:8080`
- API Key: `coco-loko-secret-2024`
- Instance Name: `coco-loko`

**Keep these safe!** You'll need them to integrate with Coco Loko.

---

## Next Steps

Once Evolution API is running and tested:

1. ✅ Evolution API is installed and running
2. ✅ Firewall is configured
3. ✅ PM2 is managing the process
4. ✅ Auto-start on boot is enabled
5. ⏭️ Integrate with Coco Loko app

---

## Monitoring

### Check if Evolution API is running:

```bash
gcloud compute ssh evoapi --zone=us-east1-d --command "pm2 status"
```

### View logs remotely:

```bash
gcloud compute ssh evoapi --zone=us-east1-d --command "pm2 logs evolution-api --lines 20 --nostream"
```

### Check resource usage:

```bash
gcloud compute ssh evoapi --zone=us-east1-d --command "pm2 monit"
```

---

## Costs

**Free Tier Includes:**
- 1 e2-micro instance (always free in us-east1, us-central1, us-west1)
- 30 GB standard persistent disk
- 1 GB network egress per month

**Your current setup:**
- ✅ e2-micro instance (free)
- ✅ 10 GB disk (free)
- ✅ us-east1 region (free tier eligible)

**Estimated cost:** $0/month (within free tier limits)

---

## Security Notes

1. **API Key**: Change `coco-loko-secret-2024` to something more secure in production
2. **Firewall**: Currently open to all IPs (0.0.0.0/0) - consider restricting to your Cloudflare Pages IPs
3. **HTTPS**: Consider adding Nginx + Let's Encrypt for SSL in production
4. **Backups**: WhatsApp sessions are stored in SQLite database in `evolution-api/instances/`

---

Ready to integrate with Coco Loko? Let me know when Evolution API is running!
