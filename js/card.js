/* UPI QR Code Generator — UPI Payment Card.
   Single source of truth for the on-screen card (DOM) and high-resolution
   exports (canvas painter). The card always renders exactly one QR code. */

import { brands } from './brands.js';
import { config } from './config.js';
import { render } from './download.js';

const CARD_QR_SIZE = 288;
const CARD_WHITE = '#ffffff';
const CARD_INK = '#0a0a0b';
const CARD_MUTED = '#5c5c60';
const CARD_SOFT = '#f3f4ee';
const CARD_BORDER = '#e4e6de';
const SUCCESS = '#1faa59';

const FONT_DISPLAY = '"Space Grotesk", sans-serif';
const FONT_MONO = '"JetBrains Mono", monospace';

const fmtDate = (date) => date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

const buildGenMeta = () => `v${config.APP.version} · ${fmtDate(new Date())}`;

const buildVpa = (data) => `${data.account}@${data.ifsc}.ifsc.npci`;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const truncate = (ctx, text, maxWidth) => {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
};

/* ------------------------------------------------------------------ */
/* On-screen DOM card                                                  */
/* ------------------------------------------------------------------ */

const resetCard = () => {
  const empty = document.getElementById('card-empty');
  const body = document.getElementById('card-body');
  if (empty) empty.hidden = false;
  if (body) body.hidden = true;
};

const updateCard = ({ qr, data }) => {
  const empty = document.getElementById('card-empty');
  const body = document.getElementById('card-body');
  if (empty) empty.hidden = true;
  if (body) body.hidden = false;

  const payee = document.getElementById('card-payee');
  const vpaEl = document.getElementById('card-vpa');
  const canvas = document.getElementById('card-canvas');
  const genMeta = document.getElementById('card-genmeta');
  const amountChip = document.getElementById('card-chip-amount');
  const noteChip = document.getElementById('card-chip-note');
  const amountValue = document.getElementById('card-chip-amount-value');
  const noteValue = document.getElementById('card-chip-note-value');

  if (payee) payee.textContent = data.name.trim();
  if (vpaEl) vpaEl.textContent = buildVpa(data);
  if (genMeta) genMeta.textContent = buildGenMeta();

  const hasAmount = Boolean(data.amount && data.amount.trim());
  const hasNote = Boolean(data.note && data.note.trim());

  if (amountChip) amountChip.hidden = !hasAmount;
  if (noteChip) noteChip.hidden = !hasNote;
  if (amountValue && hasAmount) amountValue.textContent = `₹${data.amount.trim()}`;
  if (noteValue && hasNote) noteValue.textContent = data.note.trim();

  if (canvas && qr) {
    render.renderCanvas(canvas, qr, { size: CARD_QR_SIZE, dark: '#000000', light: CARD_WHITE });
  }
};

/* ------------------------------------------------------------------ */
/* Export painter (canvas)                                             */
/* ------------------------------------------------------------------ */

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load image: ${src.slice(0, 40)}`));
    img.src = src;
  });

const drawCheck = (ctx, x, y, size) => {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.5);
  ctx.lineTo(x + size * 0.32, y + size * 0.82);
  ctx.lineTo(x + size, y - size * 0.1);
  ctx.stroke();
};

const roundRect = (ctx, x, y, w, h, r) => {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
};

const paintCard = async ({ qr, data, size = CARD_QR_SIZE }) => {
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (_e) {
      /* fall through — system fonts still render */
    }
  }
  const s = size;
  const pad = clamp(Math.round(s * 0.12), 20, 56);
  const gap = clamp(Math.round(s * 0.075), 16, 40);
  const logoH = clamp(Math.round(s * 0.16), 26, 56);
  const namePx = clamp(Math.round(s * 0.1), 20, 44);
  const monoPx = clamp(Math.round(s * 0.045), 12, 20);
  const labelPx = clamp(Math.round(s * 0.042), 11, 18);
  const appH = clamp(Math.round(s * 0.09), 18, 34);
  const W = s + pad * 2;

  const width = W;
  const cw = s; // QR module square size
  const cx = pad;
  const cy = pad;

  /* collect meta chips */
  const hasAmount = Boolean(data.amount && data.amount.trim());
  const hasNote = Boolean(data.note && data.note.trim());

  /* compute height */
  let y = cy;
  y += logoH + gap; // top row
  y += namePx * 1.2 + 4; // payee
  y += monoPx * 1.4; // vpa
  y += gap; // before QR
  y += s; // QR
  y += Math.round(gap * 0.9); // after QR
  y += labelPx * 1.6 + Math.round(gap * 0.6); // scan label
  y += appH + Math.round(gap * 0.6); // apps
  if (hasAmount || hasNote) y += monoPx * 2.2 + Math.round(gap * 0.4);
  y += Math.round(gap * 0.6); // divider spacing
  y += 1; // divider
  y += Math.round(gap * 0.55); // after divider
  y += labelPx * 2.1; // made-by block (two lines)
  y += Math.round(gap * 0.5);
  y += labelPx * 1.5; // gen meta
  const height = y + pad;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  /* card surface */
  ctx.fillStyle = CARD_WHITE;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = CARD_BORDER;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  const textCenter = (text, px, yPos, font, color, maxW) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const str = truncate(ctx, text, maxW);
    ctx.fillText(str, width / 2, yPos);
  };

  /* top row: UPI logo + verified badge */
  const logo = await loadImage(brands.upi);
  const logoScale = logoH / logo.naturalHeight;
  const logoW = logo.naturalWidth * logoScale;
  ctx.drawImage(logo, cx, cy, logoW, logoH);

  const verifiedText = 'UPI Verified';
  ctx.font = `${monoPx}px ${FONT_MONO}`;
  const vTextW = ctx.measureText(verifiedText).width;
  const vPad = Math.round(monoPx * 0.6);
  const vH = Math.round(monoPx * 1.9);
  const vW = vTextW + vPad * 2 + monoPx * 1.3;
  const vX = width - pad - vW;
  const vY = cy + logoH / 2 - vH / 2;
  ctx.strokeStyle = SUCCESS;
  ctx.lineWidth = 2;
  roundRect(ctx, vX, vY, vW, vH, 4);
  ctx.stroke();
  ctx.strokeStyle = SUCCESS;
  ctx.lineWidth = Math.max(1.5, monoPx * 0.12);
  drawCheck(ctx, vX + vPad, vY + vH / 2 - monoPx * 0.4, monoPx * 0.55);
  ctx.fillStyle = SUCCESS;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `${monoPx}px ${FONT_MONO}`;
  ctx.fillText(verifiedText, vX + vPad + monoPx * 0.75, vY + vH / 2);

  y = cy + logoH + gap;

  /* payee name */
  ctx.font = `700 ${namePx}px ${FONT_DISPLAY}`;
  ctx.fillStyle = CARD_INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const nameStr = truncate(ctx, data.name.trim() || '—', width - pad * 2);
  ctx.fillText(nameStr, width / 2, y + namePx);
  y += namePx * 1.2 + 4;

  /* VPA */
  textCenter(buildVpa(data), y + monoPx, monoPx, FONT_MONO, CARD_MUTED, width - pad * 2);
  y += monoPx * 1.4;

  /* QR */
  const qrY = y + gap;
  const qrCanvas = document.createElement('canvas');
  render.renderCanvas(qrCanvas, qr, { size: s, dark: '#000000', light: CARD_WHITE });
  ctx.drawImage(qrCanvas, cx, qrY, cw, s);
  y = qrY + s;

  /* scan label */
  y += Math.round(gap * 0.9);
  textCenter('Scan & Pay using any UPI App', y + labelPx, labelPx, FONT_MONO, '#3a3a40', width - pad * 2);
  y += labelPx * 1.6 + Math.round(gap * 0.6);

  /* app logos */
  const appImages = await Promise.all(brands.list.map((b) => loadImage(brands[b.key])));
  const totalAppW = appImages.reduce(
    (sum, img, i) => sum + img.naturalWidth * (appH / img.naturalHeight) + (i > 0 ? gap : 0),
    0
  );
  let appX = (width - totalAppW) / 2;
  for (const img of appImages) {
    const h = appH;
    const w = img.naturalWidth * (h / img.naturalHeight);
    ctx.drawImage(img, appX, y, w, h);
    appX += w + gap;
  }
  y += appH + Math.round(gap * 0.6);

  /* meta chips */
  if (hasAmount || hasNote) {
    ctx.font = `${monoPx}px ${FONT_MONO}`;
    const chips = [];
    if (hasAmount) chips.push(`₹ ${data.amount.trim()}`);
    if (hasNote) chips.push(data.note.trim());
    const chipStrs = chips.map((c) => truncate(ctx, c, (width - pad * 2 - gap) / 2));
    const chipWs = chipStrs.map((c) => ctx.measureText(c).width + monoPx * 1.6);
    const totalChips = chipWs.reduce((a, b) => a + b, 0) + (chipStrs.length - 1) * gap;
    let chipX = (width - totalChips) / 2;
    const chipH = Math.round(monoPx * 1.9);
    chipStrs.forEach((c, i) => {
      ctx.fillStyle = CARD_SOFT;
      ctx.fillRect(chipX, y, chipWs[i], chipH);
      ctx.strokeStyle = CARD_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(chipX + 0.5, y + 0.5, chipWs[i] - 1, chipH - 1);
      ctx.fillStyle = CARD_INK;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(c, chipX + monoPx * 0.8, y + chipH / 2);
      chipX += chipWs[i] + gap;
    });
    y += chipH + Math.round(gap * 0.4);
  }

  /* divider */
  y += Math.round(gap * 0.6);
  ctx.strokeStyle = CARD_BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(width - pad, y);
  ctx.stroke();
  y += Math.round(gap * 0.55);

  /* made by block */
  ctx.font = `${labelPx}px ${FONT_MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#6b6b72';
  ctx.fillText('Generated using', width / 2, y + labelPx);
  const brandText = 'IT IS UNIQUE OFFICIAL';
  const brandPx = Math.round(labelPx * 1.1);
  ctx.font = `600 ${brandPx}px ${FONT_MONO}`;
  const bTextW = ctx.measureText(brandText).width;
  const bPad = brandPx * 0.6;
  const bH = Math.round(brandPx * 1.8);
  y += labelPx * 1.1;
  ctx.fillStyle = config.BRAND.accent;
  ctx.fillRect(width / 2 - bTextW / 2 - bPad, y, bTextW + bPad * 2, bH);
  ctx.fillStyle = config.BRAND.accentInk;
  ctx.fillText(brandText, width / 2, y + bH / 2 + brandPx * 0.35);
  y += bH + Math.round(gap * 0.5);

  /* gen meta */
  ctx.font = `${labelPx}px ${FONT_MONO}`;
  ctx.fillStyle = '#9a9aa2';
  ctx.fillText(buildGenMeta(), width / 2, y + labelPx);

  return canvas;
};

/* SVG export embeds a lossless PNG of the card for pixel-identical output */
const cardSVG = async (canvas, filename) => {
  const png = canvas.toDataURL('image/png');
  const svg = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">`,
    `<image width="${canvas.width}" height="${canvas.height}" xlink:href="${png}"/>`,
    `</svg>`,
  ].join('');
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  return { blob, filename };
};

export const card = { CARD_QR_SIZE, buildVpa, buildGenMeta, resetCard, updateCard, paintCard, cardSVG };
