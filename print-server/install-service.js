/**
 * Windows Service Installer
 * 
 * Installs the print server as a Windows service that starts automatically
 * Run with: node install-service.js
 */

const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'Coco Loko Print Server',
  description: 'Local thermal printer server for Coco Loko order slips',
  script: path.join(__dirname, 'server.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: [
    {
      name: 'PORT',
      value: '3001'
    }
  ]
});

// Listen for the "install" event
svc.on('install', function() {
  console.log('✅ Service installed successfully!');
  console.log('');
  console.log('The print server will now start automatically when Windows starts.');
  console.log('');
  console.log('Service details:');
  console.log(`  Name: ${svc.name}`);
  console.log(`  Description: ${svc.description}`);
  console.log(`  Script: ${svc.script}`);
  console.log('');
  console.log('Starting service...');
  svc.start();
});

// Listen for the "start" event
svc.on('start', function() {
  console.log('✅ Service started successfully!');
  console.log('');
  console.log('The print server is now running at: http://localhost:3001');
  console.log('');
  console.log('To manage the service:');
  console.log('  - Open Services (services.msc)');
  console.log('  - Find "Coco Loko Print Server"');
  console.log('  - Right-click to Stop, Start, or Restart');
  console.log('');
  console.log('To uninstall the service, run: node uninstall-service.js');
  console.log('');
});

// Listen for errors
svc.on('error', function(err) {
  console.error('❌ Service error:', err);
});

// Check if already installed
svc.on('alreadyinstalled', function() {
  console.log('⚠️  Service is already installed!');
  console.log('');
  console.log('To reinstall:');
  console.log('  1. Run: node uninstall-service.js');
  console.log('  2. Wait for uninstall to complete');
  console.log('  3. Run: node install-service.js');
  console.log('');
});

console.log('');
console.log('🖨️  Coco Loko Print Server - Service Installer');
console.log('================================================');
console.log('');
console.log('Installing Windows service...');
console.log('This may take a few moments...');
console.log('');

// Install the service
svc.install();
