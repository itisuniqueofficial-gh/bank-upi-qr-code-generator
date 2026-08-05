/* UPI QR Code Generator — shared configuration */

const config = (() => {
  const DEFAULT_SIZE = 288;
  const SIZE_PRESETS = [192, 288, 384, 512, 768, 1024];
  const ERROR_CORRECTION = 'M';
  const STORAGE_KEYS = {
    theme: 'upi-qr-theme',
    form: 'upi-qr-form',
  };
  const REPO = 'https://github.com/itisuniqueofficial-gh/bank-upi-qr-code-generator';
  const APP = {
    name: 'UPI QR Code Generator',
    shortName: 'UPI QR',
    version: '1.1.0',
    description:
      'Generate a scannable UPI payment QR code from your account number and IFSC code. Download PNG or SVG, copy the UPI URI, and print. Runs entirely in your browser.',
    repo: REPO,
    issues: `${REPO}/issues`,
    docs: `${REPO}/blob/main/README.md`,
    roadmap: `${REPO}/blob/main/ROADMAP.md`,
    contributing: `${REPO}/blob/main/CONTRIBUTING.md`,
    license: `${REPO}/blob/main/LICENSE`,
  };

  return { DEFAULT_SIZE, SIZE_PRESETS, ERROR_CORRECTION, STORAGE_KEYS, APP };
})();

export { config };
