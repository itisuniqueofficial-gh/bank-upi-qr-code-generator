/* UPI QR Code Generator — shared configuration */

const config = (() => {
  const DEFAULT_SIZE = 288;
  const SIZE_PRESETS = [192, 288, 384, 512, 768, 1024];
  const ERROR_CORRECTION = 'M';
  const STORAGE_KEYS = {
    theme: 'upi-qr-theme',
    form: 'upi-qr-form',
  };
  const APP = {
    name: 'UPI QR Code Generator',
    shortName: 'UPI QR',
    description:
      'Generate a scannable UPI payment QR code from your account number and IFSC code. Download PNG or SVG, copy the UPI URI, and print. Runs entirely in your browser.',
  };

  return { DEFAULT_SIZE, SIZE_PRESETS, ERROR_CORRECTION, STORAGE_KEYS, APP };
})();

export { config };
