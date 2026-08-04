/* UPI QR Code Generator — shared helpers */

const utils = (() => {
  const escapeHTML = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char]
    );

  const debounce = (fn, wait = 150) => {
    let timer = null;
    return (...args) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  };

  const downloadFile = (href, filename) => {
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const blobToDataURL = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  const setAttr = (el, attrs) => {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
    return el;
  };

  const ready = (fn) => {
    if (typeof window.jQuery === 'function') {
      window.jQuery(fn);
    } else if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  const get = (id) => document.getElementById(id);

  return { escapeHTML, debounce, downloadFile, blobToDataURL, setAttr, ready, get };
})();

export { utils };
