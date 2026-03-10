/**
 * RiskView App Constants
 * Centralized configuration for the entire application
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Risk Levels
export const RISK_LEVELS = {
  LOW: {
    value: 'low',
    label: 'Low Risk',
    color: '#10B981', // Green
    bgColor: '#ECFDF5',
  },
  MEDIUM: {
    value: 'medium',
    label: 'Medium Risk',
    color: '#F59E0B', // Amber
    bgColor: '#FFFBEB',
  },
  HIGH: {
    value: 'high',
    label: 'High Risk',
    color: '#EF4444', // Red
    bgColor: '#FEF2F2',
  },
  CRITICAL: {
    value: 'critical',
    label: 'Critical Risk',
    color: '#991B1B', // Dark Red
    bgColor: '#7F1D1D',
  },
};

// Report Categories
export const REPORT_CATEGORIES = [
  { id: 1, name: 'Health & Medicine', icon: 'medical', color: '#3B82F6' },
  { id: 2, name: 'Safety & Security', icon: 'shield', color: '#EF4444' },
  { id: 3, name: 'Weather & Natural', icon: 'cloud', color: '#8B5CF6' },
  { id: 4, name: 'Transportation', icon: 'car', color: '#F59E0B' },
  { id: 5, name: 'Accommodation', icon: 'home', color: '#10B981' },
  { id: 6, name: 'Local Events', icon: 'megaphone', color: '#EC4899' },
];

// Report Status
export const REPORT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Travel Modes
export const TRAVEL_MODES = {
  WALKING: 'walking',
  DRIVING: 'driving',
  PUBLIC_TRANSPORT: 'public_transport',
  FLYING: 'flying',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  ALERT: 'alert',
  UPDATE: 'update',
  ACHIEVEMENT: 'achievement',
  MESSAGE: 'message',
  REMINDER: 'reminder',
};

// Notification Priority
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  TRAVEL_MODE: 'travelMode',
  LOCATION_HISTORY: 'locationHistory',
  DRAFT_REPORTS: 'draftReports',
  APP_PREFERENCES: 'appPreferences',
};

// Geolocation
export const GEOLOCATION = {
  HIGH_ACCURACY_THRESHOLD: 50,
  DEFAULT_MAP_ZOOM: 15,
  LOCATION_UPDATE_INTERVAL: 5000,
  LOCATION_DISTANCE_INTERVAL: 10,
  BACKGROUND_UPDATE_INTERVAL: 10000,
  BACKGROUND_DISTANCE_INTERVAL: 20,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_NOT_FOUND: 'Account not found.',
  PERMISSION_DENIED: 'Permission denied.',
  LOCATION_PERMISSION_DENIED: 'Location permission denied.',
  INVALID_LOCATION: 'Invalid location coordinates.',
  REPORT_CREATION_FAILED: 'Failed to create report.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'Account created successfully. Please login.',
  LOGIN_SUCCESS: 'Logged in successfully.',
  REPORT_CREATED: 'Report created successfully.',
};

export default {
  API_CONFIG,
  RISK_LEVELS,
  REPORT_CATEGORIES,
  REPORT_STATUS,
  TRAVEL_MODES,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  STORAGE_KEYS,
  GEOLOCATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
