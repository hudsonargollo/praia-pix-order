# Coco Loko Print Server

Local print server for thermal printers. Completely free and open-source.

## Features

- Direct ESC/POS printing to USB thermal printers
- Works with Elgin i8, Bematech, Epson, Star, and other ESC/POS printers
- Simple REST API
- Auto-detects USB printers
- Paper cutting support

## Installation

1. Install Node.js if you haven't already (https://nodejs.org/)

2. Install dependencies:
```bash
cd print-server
npm install
```

3. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3001`

## Usage

The web app will automatically detect and use the print server if it's running.

### Manual Testing

Test if the server can see your printer:
```bash
curl http://localhost:3001/status
```

Test printing:
```bash
curl -X POST http://localhost:3001/print \
  -H "Content-Type: application/json" \
  -d '{"content":"Test Receipt\nLine 2\nLine 3","orderNumber":"123"}'
```

## Auto-start on Mac

To make the print server start automatically when your Mac boots:

1. Open Terminal
2. Run:
```bash
cd print-server
npm install -g pm2
pm2 start server.js --name coco-loko-print
pm2 save
pm2 startup
```

## Troubleshooting

### Printer not detected

1. Make sure the Elgin i8 is connected via USB
2. Check if it's powered on
3. Try unplugging and replugging the USB cable
4. Restart the print server

### Permission errors on macOS

You may need to grant permissions:
```bash
sudo npm start
```

### Port already in use

If port 3001 is already in use, edit `server.js` and change the PORT variable.

## Support

This is a free, open-source solution. No subscriptions or fees required!
