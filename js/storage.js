/* UPI QR Code Generator — persistent storage */

const storage = (() => {
  const getItem = (key) => {
    try {
      return localStorage.getItem(key);
    } catch (_e) {
      return null;
    }
  };

  const setItem = (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (_e) {
      return false;
    }
  };

  const removeItem = (key) => {
    try {
      localStorage.removeItem(key);
    } catch (_e) {
      // ignore
    }
  };

  const getJSON = (key, fallback) => {
    const raw = getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch (_e) {
      return fallback;
    }
  };

  const setJSON = (key, value) => setItem(key, JSON.stringify(value));

  return { getItem, setItem, removeItem, getJSON, setJSON };
})();

export { storage };
