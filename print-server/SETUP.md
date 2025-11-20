# Print Server Setup Guide

## For the Kitchen Computer (with Elgin i8 connected)

### 1. Install Node.js
Download from: https://nodejs.org/ (LTS version)

### 2. Install Print Server
```bash
cd print-server
npm install
```

### 3. Start Print Server
```bash
npm start
```

You'll see output like:
```
🖨️  Print Server running on:
   - Local: http://localhost:3001
   - Network: http://192.168.1.100:3001
```

**Copy the Network URL** (e.g., `http://192.168.1.100:3001`)

### 4. Configure Other Computers

On any other computer accessing the kitchen page:

1. Open browser console (F12)
2. Run:
```javascript
localStorage.setItem('print_server_url', 'http://192.168.1.100:3001');
```
3. Refresh the page

Now all computers on the network can print to the thermal printer!

## Auto-Start on Mac Boot

To make the print server start automatically:

```bash
npm install -g pm2
pm2 start server.js --name print-server
pm2 save
pm2 startup
```

Follow the instructions pm2 gives you.

## How It Works

- **Kitchen computer**: Runs the print server, has Elgin i8 connected
- **Other computers**: Connect to the print server via network
- **Fallback**: If server isn't available, uses browser printing

## Troubleshooting

### Printer not detected
- Check USB connection
- Try: `sudo npm start` (may need permissions)
- Unplug/replug the Elgin i8

### Can't connect from other computers
- Check firewall settings
- Make sure both computers are on the same WiFi network
- Try pinging the kitchen computer's IP

### Port 3001 already in use
Edit `server.js` and change `const PORT = 3001;` to another port.
