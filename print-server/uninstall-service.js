/**
 * Windows Service Uninstaller
 * 
 * Removes the print server Windows service
 * Run with: node uninstall-service.js
 */

const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object (must match install configuration)
const svc = new Service({
  name: 'Coco Loko Print Server',
  script: path.join(__dirname, 'server.js')
});

// Listen for the "uninstall" event
svc.on('uninstall', function() {
  console.log('✅ Service uninstalled successfully!');
  console.log('');
  console.log('The print server service has been removed.');
  console.log('It will no longer start automatically with Windows.');
  console.log('');
});

// Listen for errors
svc.on('error', function(err) {
  console.error('❌ Uninstall error:', err);
});

// Check if not installed
svc.on('alreadyuninstalled', function() {
  console.log('⚠️  Service is not installed!');
  console.log('');
  console.log('Nothing to uninstall.');
  console.log('');
});

console.log('');
console.log('🖨️  Coco Loko Print Server - Service Uninstaller');
console.log('==================================================');
console.log('');
console.log('Uninstalling Windows service...');
console.log('This may take a few moments...');
console.log('');

// Uninstall the service
svc.uninstall();
