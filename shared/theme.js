const preferences = new Set(['system', 'light', 'dark']);
export const normalizeTheme = value => preferences.has(value) ? value : 'system';

export function resolveTheme(value, systemDark) {
  const preference = normalizeTheme(value);
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
}

// Storage adapters own their persistence boundary; restoring never writes back.
export function createThemeController({ load, save, media, apply }) {
  let preference = 'system';
  let generation = 0;
  let disposed = false;
  let persistence = Promise.resolve();
  const render = () => {
    if (!disposed) apply(resolveTheme(preference, media.matches), preference);
  };
  const onMediaChange = () => { if (preference === 'system') render(); };
  media.addEventListener('change', onMediaChange);
  const initialGeneration = generation;
  const ready = Promise.resolve().then(load).catch(() => 'system').then(value => {
    if (disposed || initialGeneration !== generation) return;
    preference = normalizeTheme(value);
    render();
  });
  return {
    ready,
    select(value) {
      if (disposed) return Promise.resolve();
      generation++;
      preference = normalizeTheme(value);
      render();
      const selected = preference;
      // Keep async adapter writes in selection order, even if one rejects.
      persistence = persistence.then(() => { if (!disposed) return save(selected); }).catch(() => {});
      return persistence;
    },
    restore(value) {
      if (disposed) return;
      generation++;
      preference = normalizeTheme(value);
      render();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      generation++;
      media.removeEventListener('change', onMediaChange);
    }
  };
}
