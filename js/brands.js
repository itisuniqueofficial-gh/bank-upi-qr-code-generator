/* UPI QR Code Generator — brand marks (single source for DOM + canvas).
   SVG files live in /assets/brands so they load identically on-screen
   and in high-resolution exports. */

const brandAssets = {
  upi: 'assets/brands/upi.svg',
  gpay: 'assets/brands/gpay.svg',
  phonepay: 'assets/brands/phonepay.svg',
  paytm: 'assets/brands/paytm.svg',
  bhim: 'assets/brands/bhim.svg',
  amazon: 'assets/brands/amazon.svg',
};

const brandList = [
  { key: 'gpay', label: 'Google Pay' },
  { key: 'phonepay', label: 'PhonePe' },
  { key: 'paytm', label: 'Paytm' },
  { key: 'bhim', label: 'BHIM' },
  { key: 'amazon', label: 'Amazon Pay' },
];

export const brands = { ...brandAssets, list: brandList };
