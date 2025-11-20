/**
 * Local Print Server for Thermal Printers
 * 
 * This server receives print jobs from the web app and sends them
 * directly to thermal printers using ESC/POS commands.
 * 
 * Supports: Elgin, Bematech, Epson, Star, and other ESC/POS printers
 */

const express = require('express');
const cors = require('cors');
const escpos = require('escpos');
const USB = require('escpos-usb');

const app = express();
const PORT = 3001;

// Enable CORS for your web app
app.use(cors());
app.use(express.json());

// Store the printer device
let printerDevice = null;

/**
 * Initialize printer connection
 */
function initPrinter() {
  try {
    // Find USB printer
    const devices = USB.findPrinter();
    
    if (devices && devices.length > 0) {
      printerDevice = new USB(devices[0].vendorId, devices[0].productId);
      console.log('✅ Printer found:', devices[0]);
      return true;
    } else {
      console.log('⚠️  No USB printer found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error initializing printer:', error);
    return false;
  }
}

/**
 * Print receipt
 */
app.post('/print', async (req, res) => {
  try {
    const { content, orderNumber } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'No content provided' });
    }

    // Initialize printer if not already done
    if (!printerDevice) {
      const initialized = initPrinter();
      if (!initialized) {
        return res.status(503).json({ error: 'Printer not available' });
      }
    }

    // Create printer instance
    const printer = new escpos.Printer(printerDevice);

    // Open device and print
    printerDevice.open((error) => {
      if (error) {
        console.error('Error opening printer:', error);
        return res.status(500).json({ error: 'Failed to open printer' });
      }

      // Print the content
      printer
        .font('a')
        .align('ct')
        .style('bu')
        .size(1, 1)
        .text('COCO LOKO')
        .text('Acaiteria')
        .text('================================')
        .align('lt')
        .style('normal');

      // Split content into lines and print
      const lines = content.split('\n');
      lines.forEach(line => {
        printer.text(line);
      });

      // Cut paper and close
      printer
        .text('\n\n\n')
        .cut()
        .close();

      console.log(`✅ Printed order #${orderNumber || 'N/A'}`);
      res.json({ success: true, message: 'Print job sent' });
    });

  } catch (error) {
    console.error('Error printing:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check printer status
 */
app.get('/status', (req, res) => {
  const devices = USB.findPrinter();
  
  res.json({
    printerConnected: devices && devices.length > 0,
    printers: devices || [],
    serverRunning: true
  });
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🖨️  Print Server running on http://localhost:${PORT}`);
  console.log('📡 Checking for printers...');
  initPrinter();
});
