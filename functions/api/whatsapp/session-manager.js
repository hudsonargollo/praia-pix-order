import { createClient } from '@supabase/supabase-js';
// Use Web Crypto API for Cloudflare Workers compatibility

// Supabase client for database operations
let supabaseClient = null;

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Initialize Supabase client
 */
function initSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseClient;
}

/**
 * Get encryption key from environment and import for Web Crypto API
 */
async function getEncryptionKey() {
  const keyHex = process.env.WHATSAPP_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('WHATSAPP_ENCRYPTION_KEY environment variable is required');
  }
  
  // Convert hex string to Uint8Array
  const keyBytes = new Uint8Array(
    keyHex.match(/.{2}/g).map(byte => parseInt(byte, 16))
  );
  
  if (keyBytes.length !== ENCRYPTION_KEY_LENGTH) {
    throw new Error(`Encryption key must be ${ENCRYPTION_KEY_LENGTH} bytes (${ENCRYPTION_KEY_LENGTH * 2} hex characters)`);
  }
  
  // Import key for Web Crypto API
  return await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt session data using Web Crypto API
 */
async function encryptSessionData(data) {
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    const jsonData = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonData);
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        additionalData: encoder.encode('whatsapp-session')
      },
      key,
      dataBuffer
    );
    
    // Combine iv + encrypted data (GCM includes auth tag)
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to hex string
    return Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Failed to encrypt session data:', error);
    throw new Error('Session encryption failed');
  }
}

/**
 * Decrypt session data using Web Crypto API
 */
async function decryptSessionData(encryptedHex) {
  try {
    const key = await getEncryptionKey();
    
    // Convert hex string back to Uint8Array
    const encryptedData = new Uint8Array(
      encryptedHex.match(/.{2}/g).map(byte => parseInt(byte, 16))
    );
    
    // Extract iv and encrypted data
    const iv = encryptedData.slice(0, IV_LENGTH);
    const encrypted = encryptedData.slice(IV_LENGTH);
    
    const encoder = new TextEncoder();
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        additionalData: encoder.encode('whatsapp-session')
      },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    const jsonData = decoder.decode(decrypted);
    
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Failed to decrypt session data:', error);
    throw new Error('Session decryption failed');
  }
}

/**
 * Save session data to database
 */
export async function saveSessionToDatabase(sessionId, sessionData, phoneNumber = null) {
  try {
    const supabase = initSupabase();
    
    // Encrypt the session data
    const encryptedData = await encryptSessionData(sessionData);
    
    // Upsert session data
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .upsert({
        session_id: sessionId,
        session_data: { encrypted: encryptedData }, // Store as JSONB with encrypted field
        phone_number: phoneNumber,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'session_id'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error saving session:', error);
      throw new Error(`Failed to save session: ${error.message}`);
    }
    
    console.log('Session saved successfully:', { sessionId, phoneNumber });
    return data;
  } catch (error) {
    console.error('Failed to save session to database:', error);
    throw error;
  }
}

/**
 * Load session data from database
 */
export async function loadSessionFromDatabase(sessionId) {
  try {
    const supabase = initSupabase();
    
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No session found
        console.log('No active session found for:', sessionId);
        return null;
      }
      console.error('Database error loading session:', error);
      throw new Error(`Failed to load session: ${error.message}`);
    }
    
    if (!data || !data.session_data || !data.session_data.encrypted) {
      console.log('No encrypted session data found for:', sessionId);
      return null;
    }
    
    // Decrypt the session data
    const decryptedData = await decryptSessionData(data.session_data.encrypted);
    
    console.log('Session loaded successfully:', { sessionId, phoneNumber: data.phone_number });
    return {
      sessionData: decryptedData,
      phoneNumber: data.phone_number,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Failed to load session from database:', error);
    throw error;
  }
}

/**
 * Clear session data from database
 */
export async function clearSessionFromDatabase(sessionId) {
  try {
    const supabase = initSupabase();
    
    const { error } = await supabase
      .from('whatsapp_sessions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);
    
    if (error) {
      console.error('Database error clearing session:', error);
      throw new Error(`Failed to clear session: ${error.message}`);
    }
    
    console.log('Session cleared successfully:', sessionId);
  } catch (error) {
    console.error('Failed to clear session from database:', error);
    throw error;
  }
}

/**
 * Get all active sessions
 */
export async function getActiveSessions() {
  try {
    const supabase = initSupabase();
    
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .select('session_id, phone_number, created_at, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Database error getting active sessions:', error);
      throw new Error(`Failed to get active sessions: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to get active sessions:', error);
    throw error;
  }
}

/**
 * Custom auth state implementation for Baileys with database persistence
 */
export function createDatabaseAuthState(sessionId) {
  let creds = null;
  let keys = {};
  
  // Load existing session data
  const loadSession = async () => {
    try {
      const sessionData = await loadSessionFromDatabase(sessionId);
      if (sessionData) {
        creds = sessionData.sessionData.creds || null;
        keys = sessionData.sessionData.keys || {};
        console.log('Loaded session from database:', { sessionId, hasCreds: !!creds, keyCount: Object.keys(keys).length });
      } else {
        console.log('No existing session found, starting fresh:', sessionId);
      }
    } catch (error) {
      console.error('Failed to load session, starting fresh:', error);
      creds = null;
      keys = {};
    }
  };
  
  // Save session data
  const saveSession = async () => {
    try {
      const sessionData = {
        creds,
        keys
      };
      
      const phoneNumber = creds?.me?.id ? creds.me.id.split(':')[0] : null;
      await saveSessionToDatabase(sessionId, sessionData, phoneNumber);
      console.log('Saved session to database:', { sessionId, phoneNumber });
    } catch (error) {
      console.error('Failed to save session:', error);
      // Don't throw here to avoid breaking the connection
    }
  };
  
  return {
    state: {
      creds,
      keys: {
        get: (type, ids) => {
          const key = `${type}:${ids.join(',')}`;
          return keys[key];
        },
        set: (data) => {
          for (const category in data) {
            for (const id in data[category]) {
              const key = `${category}:${id}`;
              const value = data[category][id];
              if (value) {
                keys[key] = value;
              } else {
                delete keys[key];
              }
            }
          }
        }
      }
    },
    saveCreds: () => {
      // This will be called when creds are updated
      saveSession();
    },
    loadSession,
    clearSession: () => clearSessionFromDatabase(sessionId)
  };
}

/**
 * Generate a secure encryption key (for setup)
 */
export function generateEncryptionKey() {
  const keyBytes = crypto.getRandomValues(new Uint8Array(ENCRYPTION_KEY_LENGTH));
  return Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}