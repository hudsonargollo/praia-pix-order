/**
 * Coco Loko Print Server
 * 
 * Local server for thermal printer communication
 * Runs on Windows/Mac/Linux and connects to USB thermal printers
 */

const express = require('express');
const cors = require('cors');
const escpos = require('escpos');
escpos.USB = require('escpos-usb');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Global printer instance
let printer = null;
let device = null;

/**
 * Initialize printer connection
 */
function initializePrinter() {
  try {
    console.log('🔍 Searching for USB thermal printers...');
    
    // Find USB printer
    const devices = escpos.USB.findPrinter();
    
    console.log(`📍 Found ${devices.length} printer(s)`);
    
    if (devices.length === 0) {
      console.log('⚠️  No USB thermal printer found');
      console.log('   Make sure:');
      console.log('   1. Printer is connected via USB');
      console.log('   2. Printer is powered on');
      console.log('   3. You have USB permissions (may need sudo on Mac/Linux)');
      return false;
    }

    // Log all found printers
    devices.forEach((d, i) => {
      console.log(`   Printer ${i + 1}:`);
      console.log(`     Vendor ID: ${d.deviceDescriptor.idVendor}`);
      console.log(`     Product ID: ${d.deviceDescriptor.idProduct}`);
    });

    // Use first available printer
    console.log('🔌 Connecting to first printer...');
    device = new escpos.USB(devices[0].deviceDescriptor.idVendor, devices[0].deviceDescriptor.idProduct);
    printer = new escpos.Printer(device);
    
    console.log('✅ Thermal printer connected successfully');
    console.log(`   Using: Vendor ${devices[0].deviceDescriptor.idVendor}, Product ${devices[0].deviceDescriptor.idProduct}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize printer:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
    console.error('');
    console.error('   Possible solutions:');
    console.error('   - On Mac: Run with sudo or grant USB permissions');
    console.error('   - Check if another app is using the printer');
    console.error('   - Try unplugging and replugging the printer');
    return false;
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    serverRunning: true,
    printerConnected: printer !== null,
    timestamp: new Date().toISOString()
  });
});

/**
 * Get printer status
 */
app.get('/status', (req, res) => {
  try {
    const devices = escpos.USB.findPrinter();
    
    res.json({
      serverRunning: true,
      printerConnected: printer !== null,
      printers: devices.map(d => ({
        vendorId: d.deviceDescriptor.idVendor,
        productId: d.deviceDescriptor.idProduct,
        manufacturer: d.deviceDescriptor.iManufacturer,
        product: d.deviceDescriptor.iProduct
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get printer status',
      message: error.message
    });
  }
});

/**
 * Print receipt endpoint
 */
app.post('/print', async (req, res) => {
  try {
    const { content, orderNumber } = req.body;

    console.log('');
    console.log('🖨️  Print request received');
    console.log(`   Order: #${orderNumber || 'N/A'}`);
    console.log(`   Content length: ${content ? content.length : 0} characters`);

    if (!content) {
      console.log('❌ No content provided');
      return res.status(400).json({
        error: 'Missing content',
        message: 'Content is required for printing'
      });
    }

    // Try to initialize printer if not connected
    if (!printer) {
      console.log('⚠️  Printer not initialized, attempting to connect...');
      const initialized = initializePrinter();
      if (!initialized) {
        console.log('❌ Failed to initialize printer');
        return res.status(503).json({
          error: 'Printer not available',
          message: 'No thermal printer found. Please connect a USB thermal printer.'
        });
      }
    }

    console.log('📤 Opening printer device...');

    // Open device and print
    device.open(function(error) {
      if (error) {
        console.error('❌ Failed to open printer device:');
        console.error('   Error:', error.message);
        return res.status(500).json({
          error: 'Failed to open printer',
          message: error.message
        });
      }

      try {
        console.log('✍️  Sending content to printer...');
        
        // Print the content
        printer
          .font('a')
          .align('ct')
          .style('normal')
          .size(1, 1)
          .text(content)
          .cut()
          .close();

        console.log(`✅ Successfully printed order #${orderNumber || 'N/A'}`);
        console.log('');
        
        res.json({
          success: true,
          message: 'Print job sent successfully',
          orderNumber
        });
      } catch (printError) {
        console.error('❌ Print error:');
        console.error('   Error:', printError.message);
        console.error('   Stack:', printError.stack);
        res.status(500).json({
          error: 'Print failed',
          message: printError.message
        });
      }
    });

  } catch (error) {
    console.error('❌ Print endpoint error:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Test print endpoint
 */
app.post('/test-print', (req, res) => {
  try {
    if (!printer) {
      const initialized = initializePrinter();
      if (!initialized) {
        return res.status(503).json({
          error: 'Printer not available',
          message: 'No thermal printer found'
        });
      }
    }

    device.open(function(error) {
      if (error) {
        return res.status(500).json({
          error: 'Failed to open printer',
          message: error.message
        });
      }

      const testContent = `
================================
      TESTE DE IMPRESSAO
================================

Coco Loko Acaiteria
Print Server v1.0

Data: ${new Date().toLocaleString('pt-BR')}

================================
  Impressora funcionando!
================================


`;

      printer
        .font('a')
        .align('ct')
        .text(testContent)
        .cut()
        .close();

      console.log('✅ Test print completed');
      
      res.json({
        success: true,
        message: 'Test print sent successfully'
      });
    });

  } catch (error) {
    console.error('Test print error:', error);
    res.status(500).json({
      error: 'Test print failed',
      message: error.message
    });
  }
});

/**
 * Reconnect printer endpoint
 */
app.post('/reconnect', (req, res) => {
  try {
    // Close existing connection
    if (device) {
      try {
        device.close();
      } catch (e) {
        // Ignore close errors
      }
    }
    
    printer = null;
    device = null;

    // Reinitialize
    const initialized = initializePrinter();
    
    if (initialized) {
      res.json({
        success: true,
        message: 'Printer reconnected successfully'
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Failed to reconnect printer'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Reconnect failed',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🖨️  Coco Loko Print Server');
  console.log('================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('================================');
  console.log('');
  
  // Try to initialize printer on startup
  initializePrinter();
  
  console.log('');
  console.log('📝 Available endpoints:');
  console.log(`   GET  /health       - Health check`);
  console.log(`   GET  /status       - Printer status`);
  console.log(`   POST /print        - Print receipt`);
  console.log(`   POST /test-print   - Test printer`);
  console.log(`   POST /reconnect    - Reconnect printer`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down print server...');
  
  if (device) {
    try {
      device.close();
      console.log('✅ Printer connection closed');
    } catch (e) {
      // Ignore close errors
    }
  }
  
  process.exit(0);
});
