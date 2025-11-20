/**
 * Local Print Server for Thermal Printers
 * 
 * This server receives print jobs from the web app and sends them
 * directly to thermal printers using ESC/POS commands.
 * 
 * Supports: Elgin, Bematech, Epson, Star, and other ESC/POS printers
 */

import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const app = express();
const PORT = 3001;

// Enable CORS for your web app
app.use(cors());
app.use(express.json());

// Printer configuration
const PRINTER_NAME = 'Printer_POS_80';

/**
 * Convert Portuguese characters to ASCII equivalents
 * This ensures compatibility with thermal printers that don't support UTF-8
 */
function normalizeText(text) {
  const replacements = {
    'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
    'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
    'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
    'ç': 'c',
    'ñ': 'n',
    'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A', 'Ä': 'A',
    'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
    'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
    'Ó': 'O', 'Ò': 'O', 'Õ': 'O', 'Ô': 'O', 'Ö': 'O',
    'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
    'Ç': 'C',
    'Ñ': 'N'
  };
  
  return text.replace(/[áàãâäéèêëíìîïóòõôöúùûüçñÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ]/g, 
    char => replacements[char] || char);
}

/**
 * Check if printer is available
 */
async function checkPrinter() {
  try {
    const { stdout } = await execAsync('lpstat -p');
    return stdout.includes(PRINTER_NAME);
  } catch (error) {
    console.error('Error checking printer:', error);
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

    // Check if printer is available
    const printerAvailable = await checkPrinter();
    if (!printerAvailable) {
      return res.status(503).json({ error: 'Printer not available' });
    }

    // Normalize text to ASCII (remove Portuguese special characters)
    const normalizedContent = normalizeText(content);

    // Write to temporary file and print from file
    const tmpFile = `/tmp/print-${Date.now()}.txt`;
    const fs = await import('fs/promises');
    await fs.writeFile(tmpFile, normalizedContent, 'ascii');
    
    // Send file to printer with raw option (no processing)
    await execAsync(`lp -d ${PRINTER_NAME} -o raw ${tmpFile}`);
    
    // Clean up temp file
    await fs.unlink(tmpFile);

    console.log(`✅ Printed order #${orderNumber || 'N/A'}`);
    res.json({ success: true, message: 'Print job sent' });

  } catch (error) {
    console.error('Error printing:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check printer status
 */
app.get('/status', async (req, res) => {
  try {
    const { stdout } = await execAsync('lpstat -p');
    const printers = stdout.split('\n').filter(line => line.includes('printer'));
    const printerConnected = stdout.includes(PRINTER_NAME);
    
    res.json({
      printerConnected,
      printerName: PRINTER_NAME,
      printers: printers.map(p => p.trim()),
      serverRunning: true
    });
  } catch (error) {
    res.json({
      printerConnected: false,
      error: error.message,
      serverRunning: true
    });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server - listen on all network interfaces
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🖨️  Print Server running on:`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Network: http://<your-ip>:${PORT}`);
  console.log('📡 Checking for printers...');
  
  const printerAvailable = await checkPrinter();
  if (printerAvailable) {
    console.log(`✅ Printer found: ${PRINTER_NAME}`);
  } else {
    console.log(`❌ Printer not found: ${PRINTER_NAME}`);
  }
  
  console.log('\n💡 To use from other computers:');
  console.log('   1. Find this computer\'s IP address');
  console.log('   2. Configure print server URL in the web app');
  console.log('   3. Make sure firewall allows port 3001\n');
});
