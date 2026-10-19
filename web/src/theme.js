import { createThemeController } from '../../shared/theme.js';

const storageKey = 'scribr-ui-theme';

export function initializeSiteTheme({ window = globalThis.window, document = globalThis.document } = {}) {
  // CSS still follows the OS if browser theme APIs are unavailable.
  if (!window.matchMedia) return null;
  const select = document.querySelector('#theme-preference');
  const control = document.querySelector('[data-theme-control]');
  const controller = createThemeController({
    load: async () => window.localStorage.getItem(storageKey),
    save: async preference => window.localStorage.setItem(storageKey, preference),
    media: window.matchMedia('(prefers-color-scheme: dark)'),
    apply(theme, preference) {
      const html = document.documentElement;
      html.dataset.theme = theme;
      html.dataset.themePreference = preference;
      html.style.colorScheme = theme;
      if (select) select.value = preference;
      // Scene adapters can listen for updates and read data-theme on mount.
      window.dispatchEvent(new window.CustomEvent('scribr:themechange', { detail: { theme, preference } }));
    }
  });
  const onChange = () => controller.select(select.value);
  const onStorage = event => {
    if (event.key !== storageKey && event.key !== null) return;
    try {
      if (event.storageArea !== window.localStorage) return;
    } catch { return; }
    controller.restore(event.newValue);
  };
  if (select) select.addEventListener('change', onChange);
  if (control) control.hidden = false;
  window.addEventListener('storage', onStorage);
  return {
    ...controller,
    dispose() {
      controller.dispose();
      if (select) select.removeEventListener('change', onChange);
      window.removeEventListener('storage', onStorage);
    }
  };
}
