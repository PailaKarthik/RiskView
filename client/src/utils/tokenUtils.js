/**
 * Token Utility Functions
 * Provides helper functions for JWT token management and validation
 */

/**
 * Decode JWT token to extract payload data
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;
    
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Invalid token format');
      return null;
    }

    // Decode payload (second part)
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    
    console.log('✅ Token decoded successfully:', decoded);
    return decoded;
  } catch (error) {
    console.error('❌ Error decoding token:', error);
    return null;
  }
};

/**
 * Extract userId from JWT token
 * @param {string} token - JWT token
 * @returns {string|null} User ID or null if unable to extract
 */
export const getUserIdFromToken = (token) => {
  const decoded = decodeToken(token);
  return decoded?.id || null;
};

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded?.exp) {
      console.warn('⚠️ Token has no expiration time');
      return false;
    }

    // exp is in seconds, Date.now() is in milliseconds
    const expirationTime = decoded.exp * 1000;
    const isExpired = Date.now() >= expirationTime;
    
    if (isExpired) {
      console.warn('⚠️ Token is expired');
    }
    
    return isExpired;
  } catch (error) {
    console.error('❌ Error checking token expiration:', error);
    return true; // Assume expired on error
  }
};

/**
 * Get token expiration time in readable format
 * @param {string} token - JWT token
 * @returns {string|null} Expiration time or null
 */
export const getTokenExpirationTime = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded?.exp) return null;

    const expirationTime = new Date(decoded.exp * 1000);
    return expirationTime.toLocaleString();
  } catch (error) {
    console.error('❌ Error getting token expiration:', error);
    return null;
  }
};

/**
 * Get time remaining until token expiration
 * @param {string} token - JWT token
 * @returns {number|null} Milliseconds until expiration or null
 */
export const getTokenTimeRemaining = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded?.exp) return null;

    const expirationTime = decoded.exp * 1000;
    const timeRemaining = expirationTime - Date.now();
    
    return Math.max(0, timeRemaining);
  } catch (error) {
    console.error('❌ Error getting token time remaining:', error);
    return null;
  }
};

/**
 * Format milliseconds to readable time string
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time string
 */
export const formatTimeRemaining = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

/**
 * Validate token integrity and expiration
 * @param {string} token - JWT token
 * @returns {object} Validation result {valid: boolean, reasons: string[]}
 */
export const validateToken = (token) => {
  const reasons = [];

  if (!token) {
    reasons.push('Token is empty');
    return { valid: false, reasons };
  }

  // Check format
  if (token.split('.').length !== 3) {
    reasons.push('Invalid token format');
    return { valid: false, reasons };
  }

  // Check expiration
  if (isTokenExpired(token)) {
    const timeRemaining = getTokenTimeRemaining(token);
    reasons.push(`Token expired (expired ${formatTimeRemaining(Math.abs(timeRemaining))} ago)`);
  }

  // Check payload
  const decoded = decodeToken(token);
  if (!decoded) {
    reasons.push('Unable to decode token');
  }

  if (!decoded?.id) {
    reasons.push('Token missing user ID');
  }

  const valid = reasons.length === 0;
  return { valid, reasons };
};

/**
 * Log token information for debugging
 * @param {string} token - JWT token
 */
export const logTokenInfo = (token) => {
  if (!token) {
    console.log('ℹ️ No token available');
    return;
  }

  console.log('📋 ─── Token Information ───');
  
  const decoded = decodeToken(token);
  if (decoded) {
    console.log('📌 User ID:', decoded.id);
    console.log('📌 Issued At:', new Date(decoded.iat * 1000).toLocaleString());
  }

  const expirationTime = getTokenExpirationTime(token);
  if (expirationTime) {
    console.log('📌 Expires At:', expirationTime);
  }

  const timeRemaining = getTokenTimeRemaining(token);
  if (timeRemaining !== null) {
    console.log('📌 Time Remaining:', formatTimeRemaining(timeRemaining));
  }

  const isExpired = isTokenExpired(token);
  console.log('📌 Status:', isExpired ? '❌ EXPIRED' : '✅ VALID');
  
  console.log('───────────────────────────');
};
