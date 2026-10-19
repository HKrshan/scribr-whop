import { normalizeTheme, resolveTheme } from '../../shared/theme.js';

// Bundled as a tiny synchronous classic script, before the stylesheet.
let preference = 'system';
try { preference = normalizeTheme(window.localStorage.getItem('scribr-ui-theme')); } catch {}
const theme = resolveTheme(preference, window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.dataset.theme = theme;
document.documentElement.dataset.themePreference = preference;
document.documentElement.style.colorScheme = theme;
