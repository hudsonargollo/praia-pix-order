import { makeWASocket, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { createDatabaseAuthState, clearSessionFromDatabase } from './session-manager.js';

// Connection status tracking
let connectionStatus = {
  isConnected: false,
  qrCode: null,
  lastConnected: null,
  phoneNumber: null,
  connectionState: 'disconnected'
};

let socket = null;
let authStateManager = null;

// Default session ID (can be made configurable)
const SESSION_ID = 'coco-loko-main';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 5,
  baseDelay: 2000, // 2 seconds
  maxDelay: 60000, // 60 seconds
  backoffMultiplier: 2
};

// Connection monitoring
let connectionMonitor = {
  retryCount: 0,
  lastRetryTime: null,
  isRetrying: false,
  healthCheckInterval: null,
  connectionStartTime: null,
  lastHeartbeat: null
};

/**
 * Initialize WhatsApp connection with Baileys
 */
async function initializeConnection() {
  try {
    console.log('Initializing WhatsApp connection...');
    
    // Get latest Baileys version
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

    // Create database auth state manager
    authStateManager = createDatabaseAuthState(SESSION_ID);
    
    // Load existing session from database
    await authStateManager.loadSession();

    // Create WhatsApp socket
    socket = makeWASocket({
      version,
      auth: authStateManager.state,
      printQRInTerminal: false, // We'll handle QR code differently
      browser: ['Coco Loko Açaiteria', 'Chrome', '1.0.0'],
      generateHighQualityLinkPreview: true,
      markOnlineOnConnect: false,
    });

    // Set up event handlers
    setupEventHandlers();

    connectionStatus.connectionState = 'connecting';
    connectionMonitor.connectionStartTime = new Date().toISOString();
    console.log('WhatsApp socket created, waiting for connection...');

    // Start health monitoring
    startHealthMonitoring();

    return socket;
  } catch (error) {
    console.error('Failed to initialize WhatsApp connection:', error);
    connectionStatus.connectionState = 'failed';
    throw error;
  }
}

/**
 * Set up event handlers for WhatsApp connection
 */
function setupEventHandlers() {
  if (!socket) return;

  // Connection updates
  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    console.log('Connection update:', { connection, qr: !!qr });

    if (qr) {
      connectionStatus.qrCode = qr;
      connectionStatus.connectionState = 'qr_required';
      console.log('QR Code generated, scan to connect');
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const errorMessage = lastDisconnect?.error?.message || 'Unknown error';
      
      console.log('Connection closed:', { statusCode, errorMessage });
      
      connectionStatus.isConnected = false;
      connectionStatus.connectionState = 'disconnected';
      stopHealthMonitoring();
      
      // Determine if we should reconnect based on the disconnect reason
      const shouldReconnect = handleDisconnectReason(statusCode, errorMessage);
      
      if (shouldReconnect) {
        console.log('Attempting to reconnect...');
        await reconnectWithBackoff(0);
      } else {
        console.log('Not reconnecting due to disconnect reason');
        if (statusCode === DisconnectReason.loggedOut) {
          console.log('Logged out, clearing auth state');
          if (authStateManager) {
            await authStateManager.clearSession();
          }
          connectionStatus.qrCode = null;
          connectionStatus.phoneNumber = null;
        }
      }
    } else if (connection === 'open') {
      console.log('WhatsApp connection opened successfully');
      connectionStatus.isConnected = true;
      connectionStatus.connectionState = 'connected';
      connectionStatus.lastConnected = new Date().toISOString();
      connectionStatus.qrCode = null;
      
      // Reset retry counter on successful connection
      connectionMonitor.retryCount = 0;
      connectionMonitor.isRetrying = false;
      connectionMonitor.lastHeartbeat = new Date().toISOString();
      
      // Get phone number info
      if (socket?.user?.id) {
        connectionStatus.phoneNumber = socket.user.id.split(':')[0];
      }
      
      console.log('Connection established, monitoring started');
    }
  });

  // Credentials update
  socket.ev.on('creds.update', async () => {
    if (authStateManager && authStateManager.saveCreds) {
      await authStateManager.saveCreds();
    }
  });

  // Messages (for future message handling)
  socket.ev.on('messages.upsert', (m) => {
    console.log('Received messages:', m.messages.length);
    // Handle incoming messages if needed
  });
}

/**
 * Reconnect with exponential backoff
 */
async function reconnectWithBackoff(attempt = 0) {
  if (connectionMonitor.isRetrying) {
    console.log('Reconnection already in progress, skipping');
    return;
  }

  connectionMonitor.isRetrying = true;
  connectionMonitor.retryCount = attempt;

  if (attempt >= RETRY_CONFIG.maxRetries) {
    console.error('Max reconnection attempts reached');
    connectionStatus.connectionState = 'failed';
    connectionMonitor.isRetrying = false;
    stopHealthMonitoring();
    return;
  }

  const delay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
    RETRY_CONFIG.maxDelay
  );

  console.log(`Reconnection attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries} in ${delay}ms`);
  connectionMonitor.lastRetryTime = new Date().toISOString();
  
  await sleep(delay);
  
  try {
    // Clean up existing socket
    if (socket) {
      socket.removeAllListeners();
      socket = null;
    }
    
    await initializeConnection();
    console.log(`Reconnection attempt ${attempt + 1} successful`);
  } catch (error) {
    console.error(`Reconnection attempt ${attempt + 1} failed:`, error);
    connectionMonitor.isRetrying = false;
    await reconnectWithBackoff(attempt + 1);
  }
}

/**
 * Start health monitoring for the connection
 */
function startHealthMonitoring() {
  // Clear existing interval
  if (connectionMonitor.healthCheckInterval) {
    clearInterval(connectionMonitor.healthCheckInterval);
  }

  // Check connection health every 30 seconds
  connectionMonitor.healthCheckInterval = setInterval(async () => {
    try {
      await performHealthCheck();
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }, 30000);

  console.log('Health monitoring started');
}

/**
 * Stop health monitoring
 */
function stopHealthMonitoring() {
  if (connectionMonitor.healthCheckInterval) {
    clearInterval(connectionMonitor.healthCheckInterval);
    connectionMonitor.healthCheckInterval = null;
  }
  console.log('Health monitoring stopped');
}

/**
 * Perform connection health check
 */
async function performHealthCheck() {
  if (!socket || !connectionStatus.isConnected) {
    return;
  }

  try {
    // Update heartbeat
    connectionMonitor.lastHeartbeat = new Date().toISOString();
    
    // Check if socket is still responsive
    const now = Date.now();
    const lastConnected = new Date(connectionStatus.lastConnected).getTime();
    const timeSinceConnection = now - lastConnected;
    
    // If connection is older than 5 minutes and we haven't had recent activity, ping
    if (timeSinceConnection > 300000) { // 5 minutes
      console.log('Performing connection health check...');
      
      // Try to get connection state
      const state = socket.ws?.readyState;
      if (state !== 1) { // WebSocket.OPEN = 1
        console.warn('WebSocket not in OPEN state:', state);
        throw new Error('WebSocket connection lost');
      }
      
      console.log('Health check passed');
    }
  } catch (error) {
    console.error('Health check detected connection issue:', error);
    
    // Mark as disconnected and trigger reconnection
    connectionStatus.isConnected = false;
    connectionStatus.connectionState = 'disconnected';
    
    if (!connectionMonitor.isRetrying) {
      console.log('Triggering automatic reconnection due to health check failure');
      await reconnectWithBackoff(0);
    }
  }
}

/**
 * Get detailed connection monitoring info
 */
function getConnectionMonitorInfo() {
  return {
    ...connectionMonitor,
    uptime: connectionMonitor.connectionStartTime 
      ? Date.now() - new Date(connectionMonitor.connectionStartTime).getTime()
      : 0,
    timeSinceLastHeartbeat: connectionMonitor.lastHeartbeat
      ? Date.now() - new Date(connectionMonitor.lastHeartbeat).getTime()
      : null
  };
}

/**
 * Handle disconnect reason and determine if reconnection should be attempted
 */
function handleDisconnectReason(statusCode, errorMessage) {
  switch (statusCode) {
    case DisconnectReason.loggedOut:
      console.log('Device logged out, will not reconnect');
      return false;
    
    case DisconnectReason.badSession:
      console.log('Bad session, clearing and will reconnect');
      if (authStateManager) {
        authStateManager.clearSession().catch(err => 
          console.error('Failed to clear bad session:', err)
        );
      }
      return true;
    
    case DisconnectReason.connectionClosed:
    case DisconnectReason.connectionLost:
    case DisconnectReason.timedOut:
      console.log('Connection issue, will reconnect');
      return true;
    
    case DisconnectReason.connectionReplaced:
      console.log('Connection replaced by another device, will not reconnect');
      return false;
    
    case DisconnectReason.restartRequired:
      console.log('Restart required, will reconnect');
      return true;
    
    default:
      // For unknown reasons, attempt to reconnect
      console.log('Unknown disconnect reason, will attempt reconnect');
      return true;
  }
}

/**
 * Clear authentication state
 */
async function clearAuthState() {
  try {
    if (authStateManager) {
      await authStateManager.clearSession();
    }
    console.log('Auth state cleared successfully');
  } catch (error) {
    console.error('Failed to clear auth state:', error);
  }
}

/**
 * Get current connection status
 */
function getConnectionStatus() {
  return {
    ...connectionStatus,
    monitoring: getConnectionMonitorInfo(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Send a text message
 */
async function sendMessage(to, message) {
  if (!socket || !connectionStatus.isConnected) {
    throw new Error('WhatsApp not connected');
  }

  try {
    // Format phone number for WhatsApp
    const formattedNumber = formatPhoneNumber(to);
    const jid = `${formattedNumber}@s.whatsapp.net`;

    const result = await socket.sendMessage(jid, { text: message });
    
    console.log('Message sent successfully:', { to: formattedNumber, messageId: result.key.id });
    return result.key.id;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}

/**
 * Format phone number for WhatsApp
 */
function formatPhoneNumber(phone) {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 55 (Brazil country code), use as is
  if (cleaned.startsWith('55')) {
    return cleaned;
  }
  
  // If it starts with 0, remove it and add Brazil country code
  if (cleaned.startsWith('0')) {
    return '55' + cleaned.substring(1);
  }
  
  // If it's a local Brazilian number, add Brazil country code
  if (cleaned.length === 10 || cleaned.length === 11) {
    return '55' + cleaned;
  }
  
  return cleaned;
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Cloudflare Function handler
 */
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const action = url.searchParams.get('action') || url.pathname.split('/').pop();

    switch (action) {
      case 'status':
        return new Response(JSON.stringify(getConnectionStatus()), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'connect':
        if (!socket || connectionStatus.connectionState === 'disconnected') {
          await initializeConnection();
        }
        return new Response(JSON.stringify(getConnectionStatus()), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'disconnect':
        if (socket) {
          await socket.logout();
          socket = null;
          connectionStatus.isConnected = false;
          connectionStatus.connectionState = 'disconnected';
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'send':
        if (method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { to, message } = await request.json();
        if (!to || !message) {
          return new Response(JSON.stringify({ error: 'Missing to or message' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const messageId = await sendMessage(to, message);
        return new Response(JSON.stringify({ success: true, messageId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'health':
        await performHealthCheck();
        return new Response(JSON.stringify({ 
          status: 'healthy',
          monitoring: getConnectionMonitorInfo()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'retry':
        if (connectionStatus.connectionState === 'failed' || !connectionStatus.isConnected) {
          await reconnectWithBackoff(0);
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Reconnection initiated' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Connection is already active' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      case 'reset':
        if (method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Force disconnect and clear session
        if (socket) {
          await socket.logout();
        }
        await clearAuthState();
        stopHealthMonitoring();
        
        // Reset all status
        connectionStatus = {
          isConnected: false,
          qrCode: null,
          lastConnected: null,
          phoneNumber: null,
          connectionState: 'disconnected'
        };
        
        connectionMonitor = {
          retryCount: 0,
          lastRetryTime: null,
          isRetrying: false,
          healthCheckInterval: null,
          connectionStartTime: null,
          lastHeartbeat: null
        };

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Connection reset successfully' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('WhatsApp function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}