/**
 * CR AudioViz AI Brand System
 * 
 * Export all brand components and configurations.
 * Usage: import { BrandedHeader, ThemeProvider } from '@/components/brand';
 */

// Configuration
export { default as brandConfig, BRAND_COLORS, THEME_CONFIG, TYPOGRAPHY, SPACING, LOGO_SPECS, CREDITS_CONFIG, APP_LOGO_STATUS } from './brand-config';

// Theme
export { ThemeProvider, useTheme } from './ThemeProvider';
export { ThemeToggle } from './ThemeToggle';

// Components
export { BrandedHeader } from './BrandedHeader';
export { BrandedFooter } from './BrandedFooter';
export { CreditsBar } from './CreditsBar';
export { AuthButtons } from './AuthButtons';

// Tailwind config extension
// 2026-09-01: REMOVED. './tailwind.brand.config' does not exist in this repo, so
// this barrel re-exported a module that was never there and every importer of
// components/brand failed to resolve. Same defect found and fixed in javari-realty.
// Nothing imports tailwindBrandConfig.
