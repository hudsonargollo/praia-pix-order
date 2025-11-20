# Coco Loko Print Server

Local thermal printer server for automatic order slip printing.

## Features

- 🖨️ Direct USB thermal printer support
- 🚀 Automatic startup with Windows
- 🔄 Auto-reconnect on printer disconnect
- 🌐 REST API for print commands
- ✅ Health monitoring
- 🧪 Test print functionality

## Requirements

- **Node.js** 16 or higher ([Download](https://nodejs.org))
- **USB Thermal Printer** (ESC/POS compatible)
- **Windows** 10/11 (for service installation)

## Quick Start

### Option 1: Manual Start (Testing)

1. Open Command Prompt or PowerShell
2. Navigate to the `print-server` folder:
   ```cmd
   cd path\to\print-server
   ```
3. Install dependencies (first time only):
   ```cmd
   npm install
   ```
4. Start the server:
   ```cmd
   npm start
   ```
   Or double-click `start-server.bat`

The server will run at `http://localhost:3001`

### Option 2: Windows Service (Production)

Install as a Windows service that starts automatically:

1. **Right-click** `install-windows-service.bat`
2. Select **"Run as administrator"**
3. Wait for installation to complete
4. The service will start automatically

The print server will now:
- ✅ Start automatically when Windows starts
- ✅ Run in the background
- ✅ Restart automatically if it crashes

## Configuration in Admin Panel

After installing the print server:

1. Open the Coco Loko admin panel
2. Go to **Admin** → **Configurações de Impressão**
3. The default URL is `http://localhost:3001`
4. Click **"Testar Conexão"** to verify
5. Click **"Imprimir Teste"** to test the printer

## Managing the Windows Service

### View Service Status

1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find **"Coco Loko Print Server"**
4. Right-click to:
   - Start
   - Stop
   - Restart
   - View Properties

### Uninstall Service

1. **Right-click** `uninstall-windows-service.bat`
2. Select **"Run as administrator"**
3. Wait for uninstallation to complete

## API Endpoints

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "serverRunning": true,
  "printerConnected": true,
  "timestamp": "2024-11-20T10:30:00.000Z"
}
```

### GET /status
Get detailed printer status

**Response:**
```json
{
  "serverRunning": true,
  "printerConnected": true,
  "printers": [
    {
      "vendorId": 1234,
      "productId": 5678,
      "manufacturer": "Printer Co",
      "product": "Thermal Printer"
    }
  ]
}
```

### POST /print
Print receipt content

**Request:**
```json
{
  "content": "Receipt text content...",
  "orderNumber": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "Print job sent successfully",
  "orderNumber": 123
}
```

### POST /test-print
Print a test receipt

**Response:**
```json
{
  "success": true,
  "message": "Test print sent successfully"
}
```

### POST /reconnect
Reconnect to the printer

**Response:**
```json
{
  "success": true,
  "message": "Printer reconnected successfully"
}
```

## Troubleshooting

### Printer Not Found

**Problem:** Server starts but no printer is detected

**Solutions:**
1. Check USB connection
2. Ensure printer is powered on
3. Try a different USB port
4. Restart the print server
5. Check Windows Device Manager for printer

### Port Already in Use

**Problem:** Error: "Port 3001 is already in use"

**Solutions:**
1. Check if another instance is running
2. Stop the Windows service if installed
3. Change port in `server.js` (line 7)
4. Restart the server

### Permission Errors

**Problem:** Cannot install Windows service

**Solutions:**
1. Run as administrator
2. Disable antivirus temporarily
3. Check Windows User Account Control settings

### Print Jobs Not Working

**Problem:** Server is running but prints don't work

**Solutions:**
1. Click "Reconnect" in admin panel
2. Try test print from admin panel
3. Check printer paper
4. Restart printer
5. Check printer USB connection

### Service Won't Start

**Problem:** Windows service fails to start

**Solutions:**
1. Open Event Viewer (eventvwr.msc)
2. Check Application logs for errors
3. Verify Node.js is installed
4. Reinstall the service:
   - Run `uninstall-windows-service.bat` as admin
   - Run `install-windows-service.bat` as admin

## Supported Printers

This server supports ESC/POS compatible thermal printers, including:

- Epson TM series
- Star Micronics
- Bixolon
- Citizen
- Custom VKP80
- And most USB thermal receipt printers

## Development

### Project Structure

```
print-server/
├── server.js                          # Main server file
├── install-service.js                 # Service installer
├── uninstall-service.js              # Service uninstaller
├── start-server.bat                  # Manual start script
├── install-windows-service.bat       # Service install script
├── uninstall-windows-service.bat     # Service uninstall script
├── package.json                      # Dependencies
└── README.md                         # This file
```

### Dependencies

- **express**: Web server framework
- **cors**: Cross-origin resource sharing
- **escpos**: ESC/POS printer driver
- **escpos-usb**: USB printer adapter
- **usb**: USB device communication
- **node-windows**: Windows service wrapper

### Logs

When running as a service, logs are stored in:
```
C:\ProgramData\Coco Loko Print Server\daemon\
```

## Security Notes

- The server runs on localhost only (not accessible from network)
- No authentication required (local access only)
- CORS enabled for local development
- Service runs with system privileges

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs
3. Test with manual start before using service
4. Ensure printer is ESC/POS compatible

## License

MIT License - Internal use for Coco Loko Açaiteria
