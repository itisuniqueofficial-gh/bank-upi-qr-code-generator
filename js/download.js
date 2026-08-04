import { utils } from './utils.js';

const QUIET_ZONE = 4;

const buildModulePath = (qr) => {
  const n = qr.getModuleCount();
  const cells = [];
  for (let row = 0; row < n; row += 1) {
    for (let col = 0; col < n; col += 1) {
      if (qr.isDark(row, col)) {
        cells.push(`M${col} ${row}h1v1h-1z`);
      }
    }
  }
  return cells.join('');
};

const renderCanvas = (canvas, qr, opts = {}) => {
  const { size = 512, dark = '#000000', light = '#ffffff' } = opts;
  const n = qr.getModuleCount();
  const total = n + QUIET_ZONE * 2;
  const scale = size / total;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = dark;
  for (let row = 0; row < n; row += 1) {
    for (let col = 0; col < n; col += 1) {
      if (qr.isDark(row, col)) {
        ctx.fillRect((col + QUIET_ZONE) * scale, (row + QUIET_ZONE) * scale, Math.ceil(scale), Math.ceil(scale));
      }
    }
  }
  return canvas;
};

const renderSVGString = (qr, opts = {}) => {
  const { dark = '#000000', light = '#ffffff' } = opts;
  const n = qr.getModuleCount();
  const total = n + QUIET_ZONE * 2;
  const path = buildModulePath(qr);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-QUIET_ZONE} ${-QUIET_ZONE} ${total} ${total}" role="img" aria-label="UPI payment QR code">`,
    `<title>UPI QR code</title>`,
    `<rect width="${total}" height="${total}" x="${-QUIET_ZONE}" y="${-QUIET_ZONE}" fill="${light}"/>`,
    `<path d="${path}" fill="${dark}" shape-rendering="crispEdges"/>`,
    `</svg>`,
  ].join('');
};

const downloadPNG = async (qr, opts = {}) => {
  const { size = 512, filename = 'upi-qr.png', dark, light } = opts;
  const canvas = document.createElement('canvas');
  renderCanvas(canvas, qr, { size, dark, light });
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (blob) utils.downloadFile(URL.createObjectURL(blob), filename);
  return Boolean(blob);
};

const downloadSVG = (qr, opts = {}) => {
  const { filename = 'upi-qr.svg', dark, light } = opts;
  const markup = renderSVGString(qr, { dark, light });
  const blob = new Blob([markup], { type: 'image/svg+xml' });
  utils.downloadFile(URL.createObjectURL(blob), filename);
};

export const render = { renderCanvas, renderSVGString, downloadPNG, downloadSVG, QUIET_ZONE };
