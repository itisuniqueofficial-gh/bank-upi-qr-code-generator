export const theme = (() => {
  const STORAGE_KEY = 'upi-qr-theme';

  const getStored = () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_e) {
      return null;
    }
  };

  const systemPrefersDark = () =>
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const resolve = (preference) => {
    if (preference === 'dark') return 'dark';
    if (preference === 'light') return 'light';
    if (preference === 'high-contrast') return 'high-contrast';
    return systemPrefersDark() ? 'dark' : 'light';
  };

  const setMetaTheme = (resolved) => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const color = resolved === 'dark' ? '#0b0f15' : resolved === 'high-contrast' ? '#000000' : '#1d4ed8';
    meta.setAttribute('content', color);
  };

  const apply = () => {
    const preference = getStored() || 'system';
    const resolved = resolve(preference);
    document.documentElement.dataset.theme = resolved;
    setMetaTheme(resolved);
    return { preference, resolved };
  };

  const set = (preference) => {
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch (_e) {
      // ignore quota/security errors
    }
    return apply();
  };

  const init = () => {
    apply();
    if (typeof window.matchMedia === 'function') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if ((getStored() || 'system') === 'system') apply();
      });
    }
  };

  return { init, apply, set, getStored, resolve };
})();
