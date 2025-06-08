// API Configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Default image for menu items
export const DEFAULT_FOOD_IMAGE = `${API_URL}/uploads/menu/default.jpg`;

// Rating settings
export const MIN_RATING = 1;
export const MAX_RATING = 5;

// App settings
export const APP_NAME = 'Nhà hàng XYZ';

// Breakpoints (matching MUI breakpoints)
export const BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
}; 