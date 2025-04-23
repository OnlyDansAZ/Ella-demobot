import { ThemeOption } from '@/components/ThemeSelector';

/**
 * Theme utilities for managing and applying themes to the application
 */

// Interface for theme settings that are stored in localStorage
export interface StoredThemeSettings {
  themeId: string;
  bubbleOpacity: number;
  usePrimaryColor: boolean;
  animationsEnabled: boolean;
  fontScale: number;
}

// Default theme settings if none are found in localStorage
const DEFAULT_THEME_SETTINGS: StoredThemeSettings = {
  themeId: 'default',
  bubbleOpacity: 1,
  usePrimaryColor: false,
  animationsEnabled: true,
  fontScale: 1
};

// Local storage key for theme settings
const THEME_SETTINGS_KEY = 'ella_theme_settings';

/**
 * Apply a theme to the document by setting CSS variables
 * 
 * @param theme - The theme to apply
 */
export function applyTheme(theme: ThemeOption): void {
  const root = document.documentElement;
  
  // Set main theme colors
  root.style.setProperty('--theme-primary', theme.primaryColor);
  root.style.setProperty('--theme-secondary', theme.secondaryColor);
  root.style.setProperty('--theme-accent', theme.accentColor);
  
  // Compute and set derived colors
  const primaryRgb = hexToRgb(theme.primaryColor);
  const secondaryRgb = hexToRgb(theme.secondaryColor);
  const accentRgb = hexToRgb(theme.accentColor);
  
  if (primaryRgb) {
    root.style.setProperty('--theme-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    
    // Set primary with various opacity levels
    root.style.setProperty('--theme-primary-10', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`);
    root.style.setProperty('--theme-primary-20', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2)`);
    root.style.setProperty('--theme-primary-50', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.5)`);
    root.style.setProperty('--theme-primary-80', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.8)`);
  }
  
  if (secondaryRgb) {
    root.style.setProperty('--theme-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
  }
  
  if (accentRgb) {
    root.style.setProperty('--theme-accent-rgb', `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`);
  }
  
  // Set derived UI colors based on theme brightness
  const isDarkTheme = calculateBrightness(theme.secondaryColor) < 128;
  
  if (isDarkTheme) {
    // Dark theme text and UI colors
    root.style.setProperty('--theme-text', '#ffffff');
    root.style.setProperty('--theme-text-secondary', '#b0b0b0');
    root.style.setProperty('--theme-border', '#3a3a3a');
    root.style.setProperty('--theme-background', '#121212');
    root.style.setProperty('--theme-card-background', '#1e1e1e');
    
    // Add dark theme class to body for additional CSS selectors
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  } else {
    // Light theme text and UI colors
    root.style.setProperty('--theme-text', '#1a1a1a');
    root.style.setProperty('--theme-text-secondary', '#5a5a5a');
    root.style.setProperty('--theme-border', '#e1e1e1');
    root.style.setProperty('--theme-background', '#ffffff');
    root.style.setProperty('--theme-card-background', '#f8f8f8');
    
    // Add light theme class to body for additional CSS selectors
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  }
}

/**
 * Apply font scaling to the document
 * 
 * @param scale - The scale factor to apply (1 is normal size)
 */
export function applyFontScale(scale: number): void {
  const root = document.documentElement;
  
  // Set base font size (default is usually 16px)
  root.style.setProperty('--font-scale', scale.toString());
  
  // Apply calculated font sizes
  root.style.setProperty('--font-size-xs', `calc(0.75rem * var(--font-scale))`);
  root.style.setProperty('--font-size-sm', `calc(0.875rem * var(--font-scale))`);
  root.style.setProperty('--font-size-base', `calc(1rem * var(--font-scale))`);
  root.style.setProperty('--font-size-lg', `calc(1.125rem * var(--font-scale))`);
  root.style.setProperty('--font-size-xl', `calc(1.25rem * var(--font-scale))`);
  root.style.setProperty('--font-size-2xl', `calc(1.5rem * var(--font-scale))`);
  root.style.setProperty('--font-size-3xl', `calc(1.875rem * var(--font-scale))`);
  
  // Apply spacing adjustments based on font scale
  root.style.setProperty('--spacing-scale', Math.max(0.9, Math.min(1.1, scale)).toString());
  root.style.setProperty('--spacing-base', `calc(1rem * var(--spacing-scale))`);
}

/**
 * Enable or disable animations globally
 * 
 * @param enabled - Whether animations should be enabled
 */
export function setAnimationsEnabled(enabled: boolean): void {
  const root = document.documentElement;
  
  if (enabled) {
    root.style.setProperty('--animation-duration', '300ms');
    root.style.setProperty('--transition-duration', '150ms');
    document.body.classList.remove('animations-disabled');
  } else {
    root.style.setProperty('--animation-duration', '0ms');
    root.style.setProperty('--transition-duration', '0ms');
    document.body.classList.add('animations-disabled');
  }
}

/**
 * Set message bubble opacity
 * 
 * @param opacity - Opacity value between 0 and 1
 */
export function setBubbleOpacity(opacity: number): void {
  const root = document.documentElement;
  root.style.setProperty('--bubble-opacity', opacity.toString());
}

/**
 * Set whether to use primary color for user message bubbles
 * 
 * @param use - Whether to use primary color
 */
export function setUsePrimaryColorForUserMessages(use: boolean): void {
  const root = document.documentElement;
  
  if (use) {
    root.style.setProperty('--user-bubble-bg', 'var(--theme-primary)');
    root.style.setProperty('--user-bubble-text', 'white');
  } else {
    root.style.setProperty('--user-bubble-bg', '#E5E7EB');
    root.style.setProperty('--user-bubble-text', '#1a1a1a');
  }
}

/**
 * Save theme settings to localStorage
 * 
 * @param settings - The theme settings to save
 */
export function saveThemeSettings(settings: StoredThemeSettings): void {
  try {
    localStorage.setItem(THEME_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save theme settings to localStorage:', error);
  }
}

/**
 * Load theme settings from localStorage
 * 
 * @returns The stored theme settings, or default settings if none found
 */
export function loadThemeSettings(): StoredThemeSettings {
  try {
    const storedSettings = localStorage.getItem(THEME_SETTINGS_KEY);
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings) as StoredThemeSettings;
      
      // Ensure all required properties exist (in case the structure changed)
      return {
        ...DEFAULT_THEME_SETTINGS,
        ...parsedSettings
      };
    }
  } catch (error) {
    console.error('Failed to load theme settings from localStorage:', error);
  }
  
  return DEFAULT_THEME_SETTINGS;
}

/**
 * Apply all theme settings from stored settings
 */
export function applyStoredThemeSettings(): void {
  const settings = loadThemeSettings();
  
  // Find the theme object that corresponds to the stored theme ID
  const defaultThemes = [
    {
      id: 'default',
      name: 'Default',
      primaryColor: '#3b82f6', // blue-500
      secondaryColor: '#f3f4f6', // gray-100
      accentColor: '#10b981', // emerald-500
      description: 'The standard YoBot theme with a clean, professional look'
    },
    {
      id: 'modern',
      name: 'Modern Blue',
      primaryColor: '#2563eb', // blue-600
      secondaryColor: '#e0f2fe', // sky-100
      accentColor: '#06b6d4', // cyan-500
      description: 'A sleek and modern blue theme with light accents'
    },
    {
      id: 'night',
      name: 'Night Mode',
      primaryColor: '#6366f1', // indigo-500
      secondaryColor: '#1e1e2d', // dark gray
      accentColor: '#8b5cf6', // violet-500
      description: 'Dark theme with vibrant purple accents for low-light environments'
    },
    {
      id: 'nature',
      name: 'Natural Green',
      primaryColor: '#10b981', // emerald-500
      secondaryColor: '#ecfdf5', // emerald-50
      accentColor: '#059669', // emerald-600
      description: 'Calm and natural green theme inspired by nature'
    },
    {
      id: 'sunset',
      name: 'Sunset Orange',
      primaryColor: '#f97316', // orange-500
      secondaryColor: '#fff7ed', // orange-50
      accentColor: '#ea580c', // orange-600
      description: 'Warm and energetic theme with sunset-inspired colors'
    },
  ];
  
  const theme = defaultThemes.find(t => t.id === settings.themeId) || defaultThemes[0];
  
  // Apply all settings
  applyTheme(theme);
  applyFontScale(settings.fontScale);
  setAnimationsEnabled(settings.animationsEnabled);
  setBubbleOpacity(settings.bubbleOpacity);
  setUsePrimaryColorForUserMessages(settings.usePrimaryColor);
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex to RGB
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return { r, g, b };
}

// Helper function to calculate brightness (0-255) of a hex color
// Used to determine if a color is light or dark
function calculateBrightness(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 128; // Default middle brightness
  
  // Formula: (R * 299 + G * 587 + B * 114) / 1000
  // This gives more weight to green which the human eye is more sensitive to
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
}