/**
 * Coco Loko Print Server
 * 
 * Local server for thermal printer communication
 * Runs on Windows/Mac/Linux and connects to USB thermal printers
 */

const express = require('express');
const cors = require('cors');
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Global printer instance
let printer = null;
let printerName = null;

/**
 * Initialize printer connection with multiple attempts
 */
function initializePrinter() {
  const printerNames = [
    process.env.PRINTER_NAME,
    'ELGIN I8',
    'Elgin I8',
    'ELGIN_I8',
    'Elgin_I8',
    'I8'
  ].filter(Boolean);

  console.log('🔍 Initializing thermal printer...');
  console.log('   Platform:', process.platform);
  console.log('   Available printer names to try:', printerNames);
  
  // Try each printer name with different driver types
  const driverTypes = [
    { type: PrinterTypes.EPSON, name: 'EPSON (ESC/POS)' },
    { type: PrinterTypes.STAR, name: 'STAR' },
    { type: PrinterTypes.TANCA, name: 'TANCA' }
  ];
  
  for (const name of printerNames) {
    for (const driver of driverTypes) {
      try {
        console.log(`   Attempting: "${name}" with ${driver.name} driver`);
        
        const config = {
          type: driver.type,
          interface: `printer:${name}`,
          characterSet: 'PC437_USA',
          removeSpecialCharacters: false,
          lineCharacter: "=",
          options: {
            timeout: 5000
          }
        };
        
        printer = new ThermalPrinter(config);
        printerName = name;
        
        console.log('✅ Thermal printer initialized successfully');
        console.log(`   Connected to: ${name}`);
        console.log(`   Driver: ${driver.name}`);
        
        return true;
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        printer = null;
        printerName = null;
      }
    }
  }
  
  // All attempts failed
  console.error('');
  console.error('❌ Could not connect to any printer');
  console.error('');
  console.error('   Troubleshooting steps:');
  console.error('   1. Check printer is ON and connected via USB');
  console.error('   2. Verify printer shows as "ELGIN I8" in Windows Devices and Printers');
  console.error('   3. Make sure printer is set as DEFAULT printer');
  console.error('   4. Try printing a test page from Windows first');
  console.error('   5. Install Elgin I8 driver from: https://www.elgin.com.br/');
  console.error('   6. Restart the print server after installing driver');
  console.error('');
  
  return false;
}

/**
 * Print using Windows raw printing with ESC/POS commands
 */
async function printRawWindows(content) {
  if (process.platform !== 'win32') {
    throw new Error('Raw Windows printing only available on Windows');
  }
  
  const fs = require('fs');
  const path = require('path');
  
  // Create temp file with .prn extension for raw printing
  const tempFile = path.join(require('os').tmpdir(), `print_${Date.now()}.prn`);
  
  try {
    // Add ESC/POS commands for thermal printer
    const ESC = '\x1B';
    const GS = '\x1D';
    
    // Initialize printer + content + cut paper
    const rawData = 
      ESC + '@' +           // Initialize printer
      content + '\n\n\n' +  // Content with extra lines
      GS + 'V' + '\x41' +   // Cut paper (partial cut)
      '\n';
    
    // Write raw data to temp file
    fs.writeFileSync(tempFile, rawData, 'binary');
    
    console.log(`   Created temp file: ${tempFile}`);
    console.log(`   File size: ${fs.statSync(tempFile).size} bytes`);
    console.log(`   Content preview: ${content.substring(0, 50)}...`);
    
    const targetPrinter = printerName || 'ELGIN I8';
    console.log(`   Target printer: ${targetPrinter}`);
    
    // Try multiple methods to print
    let printed = false;
    
    // Method 1: Direct copy to printer share
    try {
      const printerShare = `\\\\localhost\\${targetPrinter.replace(/ /g, '_')}`;
      const copyCmd = `copy /B "${tempFile}" "${printerShare}"`;
      console.log(`   Method 1 - Trying: ${copyCmd}`);
      const result = await execAsync(copyCmd);
      console.log(`   ✅ Method 1 succeeded: ${result.stdout}`);
      printed = true;
    } catch (e) {
      console.log(`   ❌ Method 1 failed: ${e.message}`);
    }
    
    // Method 2: Copy to printer with spaces
    if (!printed) {
      try {
        const printerShare = `\\\\localhost\\${targetPrinter}`;
        const copyCmd = `copy /B "${tempFile}" "${printerShare}"`;
        console.log(`   Method 2 - Trying: ${copyCmd}`);
        const result = await execAsync(copyCmd);
        console.log(`   ✅ Method 2 succeeded: ${result.stdout}`);
        printed = true;
      } catch (e) {
        console.log(`   ❌ Method 2 failed: ${e.message}`);
      }
    }
    
    // Method 3: Use Windows print command
    if (!printed) {
      try {
        const printCmd = `print /D:"${targetPrinter}" "${tempFile}"`;
        console.log(`   Method 3 - Trying: ${printCmd}`);
        const result = await execAsync(printCmd);
        console.log(`   ✅ Method 3 succeeded: ${result.stdout}`);
        printed = true;
      } catch (e) {
        console.log(`   ❌ Method 3 failed: ${e.message}`);
      }
    }
    
    // Method 4: Try with LPT port (if printer is on LPT1)
    if (!printed) {
      try {
        const copyCmd = `copy /B "${tempFile}" LPT1`;
        console.log(`   Method 4 - Trying: ${copyCmd}`);
        const result = await execAsync(copyCmd);
        console.log(`   ✅ Method 4 succeeded: ${result.stdout}`);
        printed = true;
      } catch (e) {
        console.log(`   ❌ Method 4 failed: ${e.message}`);
      }
    }
    
    if (!printed) {
      console.error('   ❌ All print methods failed!');
      console.error('   Please check:');
      console.error('   1. Printer is ON and has paper');
      console.error('   2. Printer is shared in Windows (Control Panel > Devices and Printers > Right-click > Printer properties > Sharing)');
      console.error('   3. Try printing a test page from Windows first');
    }
    
    // Clean up temp file
    setTimeout(() => {
      try {
        fs.unlinkSync(tempFile);
        console.log(`   🗑️  Cleaned up temp file`);
      } catch (e) {
        // Ignore cleanup errors
      }
    }, 2000);
    
    return printed;
  } catch (error) {
    console.error(`   ❌ Print error: ${error.message}`);
    
    // Clean up on error
    try {
      fs.unlinkSync(tempFile);
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    serverRunning: true,
    printerConnected: printer !== null || printerName !== null,
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
      printerConnected: printer !== null || printerName !== null,
      printerName: printerName,
      printerType: printer ? 'ESC/POS' : 'Windows Raw',
      interface: printer ? 'USB Auto-detect' : 'Windows Print Command'
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
    if (!printer && !printerName) {
      console.log('⚠️  Printer not initialized, attempting to connect...');
      const initialized = initializePrinter();
      if (!initialized && process.platform === 'win32') {
        console.log('⚠️  Falling back to Windows raw printing...');
        printerName = 'ELGIN I8';
      } else if (!initialized) {
        console.log('❌ Failed to initialize printer');
        return res.status(503).json({
          error: 'Printer not available',
          message: 'No thermal printer found. Please connect a USB thermal printer.'
        });
      }
    }

    console.log('✍️  Sending content to printer...');

    try {
      if (printer) {
        // Use thermal printer library
        printer.clear();
        printer.println(content);
        printer.cut();
        await printer.execute();
      } else if (process.platform === 'win32') {
        // Use Windows raw printing
        await printRawWindows(content);
      } else {
        throw new Error('No printing method available');
      }

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
      res.status(500).json({
        error: 'Print failed',
        message: printError.message
      });
    }

  } catch (error) {
    console.error('❌ Print endpoint error:');
    console.error('   Error:', error.message);
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
    if (!printer && !printerName) {
      const initialized = initializePrinter();
      if (!initialized && process.platform === 'win32') {
        printerName = 'ELGIN I8';
      } else if (!initialized) {
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

    if (printer) {
      printer.clear();
      printer.println(testContent);
      printer.cut();
      await printer.execute();
    } else if (process.platform === 'win32') {
      await printRawWindows(testContent);
    }

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
    printerName = null;

    // Reinitialize
    const initialized = initializePrinter();
    
    if (initialized || (process.platform === 'win32')) {
      if (!initialized) {
        printerName = 'ELGIN I8';
      }
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
  const initialized = initializePrinter();
  if (!initialized && process.platform === 'win32') {
    console.log('⚠️  Using Windows raw printing fallback');
    printerName = 'ELGIN I8';
  }
  
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
