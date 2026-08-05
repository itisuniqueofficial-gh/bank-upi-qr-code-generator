/* UPI QR Code Generator — shared configuration */

const config = (() => {
  const DEFAULT_SIZE = 512;
  const SIZE_PRESETS = [256, 384, 512, 768, 1024, 1536];
  const CARD_SIZES = [256, 384, 512, 768, 1024, 1536];
  const ERROR_CORRECTION = 'M';
  const STORAGE_KEYS = {
    theme: 'upi-qr-theme',
    form: 'upi-qr-form',
  };
  const REPO = 'https://github.com/itisuniqueofficial-gh/bank-upi-qr-code-generator';
  const BRAND = {
    name: 'IT IS UNIQUE OFFICIAL',
    url: 'https://www.itisuniqueofficial.com/',
    accent: '#b6ff2e',
    accentInk: '#0a0a0b',
  };
  const APP = {
    name: 'UPI QR Code Generator',
    shortName: 'UPI QR',
    version: '1.2.0',
    description:
      'Generate a professional UPI payment card with a scannable QR code from your bank account and IFSC. Download PNG, SVG, or PDF, copy the UPI URI, and print. Runs entirely in your browser.',
    repo: REPO,
    issues: `${REPO}/issues`,
    docs: `${REPO}/blob/main/README.md`,
    roadmap: `${REPO}/blob/main/ROADMAP.md`,
    contributing: `${REPO}/blob/main/CONTRIBUTING.md`,
    license: `${REPO}/blob/main/LICENSE`,
  };

  return { DEFAULT_SIZE, SIZE_PRESETS, CARD_SIZES, ERROR_CORRECTION, STORAGE_KEYS, APP, BRAND };
})();

export { config };
