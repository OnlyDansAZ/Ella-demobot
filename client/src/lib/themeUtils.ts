import { ThemeOption } from '@/components/ThemeSelector';

/**
 * Applies a theme by setting CSS variables
 * @param theme The theme to apply
 */
export function applyTheme(theme: ThemeOption): void {
  const root = document.documentElement;
  
  // Convert hex to hsl for compatibility with shadcn-ui
  const primaryHsl = hexToHSL(theme.primaryColor);
  const accentHsl = hexToHSL(theme.accentColor);
  
  // Set the primary color (used for buttons, active states, etc.)
  if (primaryHsl) {
    root.style.setProperty('--primary-h', primaryHsl.h.toString());
    root.style.setProperty('--primary-s', `${primaryHsl.s}%`);
    root.style.setProperty('--primary-l', `${primaryHsl.l}%`);
  }
  
  // Set the accent color (used for highlights and secondary elements)
  if (accentHsl) {
    root.style.setProperty('--accent-h', accentHsl.h.toString());
    root.style.setProperty('--accent-s', `${accentHsl.s}%`);
    root.style.setProperty('--accent-l', `${accentHsl.l}%`);
  }
  
  // Update metadata for the theme
  root.setAttribute('data-theme', theme.id);
}

/**
 * Applies font scaling throughout the app
 * @param scale The scale factor to apply (1.0 = 100%)
 */
export function applyFontScale(scale: number): void {
  const root = document.documentElement;
  root.style.setProperty('--font-scale', scale.toString());
  
  // Apply the scale to appropriate text elements
  document.querySelectorAll('.scale-font').forEach(el => {
    const baseSize = el.getAttribute('data-base-size') || '1rem';
    (el as HTMLElement).style.fontSize = `calc(${baseSize} * ${scale})`;
  });
}

/**
 * Convert hex color to HSL components
 * @param hex Hex color string (e.g., "#ff0000")
 * @returns HSL components as {h, s, l} or null if invalid
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  // Remove the # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16) / 255;
    g = parseInt(hex[1] + hex[1], 16) / 255;
    b = parseInt(hex[2] + hex[2], 16) / 255;
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16) / 255;
    g = parseInt(hex.substring(2, 4), 16) / 255;
    b = parseInt(hex.substring(4, 6), 16) / 255;
  } else {
    return null; // Invalid hex
  }
  
  // Find min and max channel values
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  const delta = max - min;
  
  // Calculate HSL values
  let h = 0;
  let s = 0;
  let l = (min + max) / 2;
  
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
      h = ((b - r) / delta + 2) * 60;
    } else {
      h = ((r - g) / delta + 4) * 60;
    }
  }
  
  // Round and return
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Persist theme settings to localStorage
 */
export function saveThemeSettings(settings: {
  themeId: string;
  bubbleOpacity: number;
  usePrimaryColor: boolean;
  animationsEnabled: boolean;
  fontScale: number;
}): void {
  localStorage.setItem('yobot-theme-settings', JSON.stringify(settings));
}

/**
 * Load theme settings from localStorage
 */
export function loadThemeSettings(): {
  themeId: string;
  bubbleOpacity: number;
  usePrimaryColor: boolean;
  animationsEnabled: boolean;
  fontScale: number;
} {
  const defaultSettings = {
    themeId: 'default',
    bubbleOpacity: 1,
    usePrimaryColor: false,
    animationsEnabled: true,
    fontScale: 1
  };
  
  try {
    const stored = localStorage.getItem('yobot-theme-settings');
    if (!stored) return defaultSettings;
    
    const settings = JSON.parse(stored);
    return {
      ...defaultSettings,
      ...settings
    };
  } catch (error) {
    console.error('Failed to load theme settings:', error);
    return defaultSettings;
  }
}