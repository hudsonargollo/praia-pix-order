#!/usr/bin/env node

/**
 * WhatsApp Environment Setup Script
 * 
 * This script helps set up the required environment variables for WhatsApp notifications
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 WhatsApp Notifications Environment Setup\n');

// Generate encryption key
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Check if .env file exists
function checkEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  return fs.existsSync(envPath);
}

// Read .env file
function readEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const content = fs.readFileSync(envPath, 'utf-8');
  const vars = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
  
  return vars;
}

// Update .env file
function updateEnvFile(newVars) {
  const envPath = path.join(__dirname, '..', '.env');
  let content = '';
  
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf-8');
  }
  
  // Add new variables
  const additions = [];
  for (const [key, value] of Object.entries(newVars)) {
    if (!content.includes(`${key}=`)) {
      additions.push(`${key}=${value}`);
    }
  }
  
  if (additions.length > 0) {
    if (content && !content.endsWith('\n')) {
      content += '\n';
    }
    content += '\n# WhatsApp Configuration (Server-side)\n';
    content += additions.join('\n') + '\n';
    
    fs.writeFileSync(envPath, content);
    console.log('✅ Updated .env file with new variables\n');
  }
}

// Main setup
function main() {
  const envVars = readEnvFile();
  
  console.log('📋 Checking required environment variables...\n');
  
  const required = {
    'SUPABASE_URL': 'Supabase project URL (server-side)',
    'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key (server-side)',
    'WHATSAPP_ENCRYPTION_KEY': 'WhatsApp session encryption key',
    'WHATSAPP_SESSION_ID': 'WhatsApp session identifier'
  };
  
  const missing = [];
  const present = [];
  
  for (const [key, description] of Object.entries(required)) {
    if (envVars[key]) {
      present.push(`✅ ${key}: ${description}`);
    } else {
      missing.push(`❌ ${key}: ${description}`);
    }
  }
  
  if (present.length > 0) {
    console.log('Present variables:');
    present.forEach(msg => console.log(`  ${msg}`));
    console.log();
  }
  
  if (missing.length > 0) {
    console.log('Missing variables:');
    missing.forEach(msg => console.log(`  ${msg}`));
    console.log();
  }
  
  // Generate encryption key if missing
  if (!envVars['WHATSAPP_ENCRYPTION_KEY']) {
    const encryptionKey = generateEncryptionKey();
    console.log('🔑 Generated new encryption key:');
    console.log(`   ${encryptionKey}\n`);
    console.log('   ⚠️  IMPORTANT: Save this key securely!\n');
    
    const newVars = {
      'WHATSAPP_ENCRYPTION_KEY': encryptionKey
    };
    
    if (!envVars['WHATSAPP_SESSION_ID']) {
      newVars['WHATSAPP_SESSION_ID'] = 'coco-loko-main';
    }
    
    if (!envVars['SUPABASE_URL'] && envVars['VITE_SUPABASE_URL']) {
      newVars['SUPABASE_URL'] = envVars['VITE_SUPABASE_URL'];
    }
    
    updateEnvFile(newVars);
  }
  
  // Instructions for Cloudflare
  console.log('📝 Cloudflare Pages Configuration:\n');
  console.log('   Set these environment variables in Cloudflare Dashboard:');
  console.log('   (Pages → Your Project → Settings → Environment Variables)\n');
  
  if (envVars['SUPABASE_URL']) {
    console.log(`   SUPABASE_URL=${envVars['SUPABASE_URL']}`);
  } else if (envVars['VITE_SUPABASE_URL']) {
    console.log(`   SUPABASE_URL=${envVars['VITE_SUPABASE_URL']}`);
  } else {
    console.log('   SUPABASE_URL=<your-supabase-url>');
  }
  
  if (envVars['SUPABASE_SERVICE_ROLE_KEY']) {
    console.log(`   SUPABASE_SERVICE_ROLE_KEY=${envVars['SUPABASE_SERVICE_ROLE_KEY'].substring(0, 20)}...`);
  } else {
    console.log('   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>');
  }
  
  if (envVars['WHATSAPP_ENCRYPTION_KEY']) {
    console.log(`   WHATSAPP_ENCRYPTION_KEY=${envVars['WHATSAPP_ENCRYPTION_KEY']}`);
  } else {
    console.log('   WHATSAPP_ENCRYPTION_KEY=<generated-key-above>');
  }
  
  console.log(`   WHATSAPP_SESSION_ID=${envVars['WHATSAPP_SESSION_ID'] || 'coco-loko-main'}`);
  console.log();
  
  // Summary
  console.log('📚 Next Steps:\n');
  console.log('   1. Add missing environment variables to .env for local development');
  console.log('   2. Set all variables in Cloudflare Dashboard for production');
  console.log('   3. Run database migrations: npx supabase db push');
  console.log('   4. Deploy to Cloudflare Pages: npm run build && wrangler pages deploy dist');
  console.log('   5. Connect WhatsApp by scanning QR code in admin dashboard\n');
  
  console.log('📖 For detailed instructions, see: PRODUCTION_DEPLOYMENT.md\n');
}

main();
