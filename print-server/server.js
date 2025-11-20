/**
 * Coco Loko Print Server
 * 
 * Local server for thermal printer communication
 * Runs on Windows/Mac/Linux and connects to USB thermal printers
 */

const express = require('express');
const cors = require('cors');
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Global printer instance
let printer = null;

/**
 * Initialize printer connection
 */
function initializePrinter() {
  try {
    console.log('🔍 Initializing thermal printer...');
    
    // Create printer instance
    // This library auto-detects USB printers
    printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,  // Most thermal printers are ESC/POS compatible
      interface: 'printer:auto',  // Auto-detect printer
      characterSet: 'PC437_USA',
      removeSpecialCharacters: false,
      lineCharacter: "=",
      options: {
        timeout: 5000
      }
    });
    
    console.log('✅ Thermal printer initialized successfully');
    console.log('   Type: ESC/POS compatible');
    console.log('   Interface: Auto-detect');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize printer:');
    console.error('   Error:', error.message);
    console.error('');
    console.error('   Possible solutions:');
    console.error('   - Make sure printer is connected via USB');
    console.error('   - Make sure printer is powered on');
    console.error('   - On Mac: Run with sudo for USB access');
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
    res.json({
      serverRunning: true,
      printerConnected: printer !== null,
      printerType: printer ? 'ESC/POS' : null,
      interface: printer ? 'USB Auto-detect' : null
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

    console.log('✍️  Sending content to printer...');

    try {
      // Clear any previous content
      printer.clear();
      
      // Print the raw content
      printer.println(content);
      
      // Cut paper
      printer.cut();
      
      // Execute print job
      await printer.execute();

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
app.post('/test-print', async (req, res) => {
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

    printer.clear();
    printer.println(testContent);
    printer.cut();
    await printer.execute();

    console.log('✅ Test print completed');
    
    res.json({
      success: true,
      message: 'Test print sent successfully'
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
    // Reset printer
    printer = null;

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
  console.log('✅ Server stopped');
  process.exit(0);
});
