/* UPI QR Code Generator — dependency-free PDF export.
   Wraps the card canvas in a single-page PDF. Lossless (deflated RGB)
   when CompressionStream is available, otherwise embeds raw RGB. */

const A4 = { width: 595.28, height: 841.89 };
const PAGE_MARGIN = 36;
const SCALE_MAX = 4;

const deflate = async (data) => {
  if (typeof CompressionStream === 'undefined') return null;
  const stream = new CompressionStream('deflate');
  const writer = stream.writable.getWriter();
  writer.write(data);
  writer.close();
  return new Response(stream.readable).arrayBuffer();
};

const canvasToRGB = (canvas) => {
  const { width, height } = canvas;
  const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    rgb[j] = data[i];
    rgb[j + 1] = data[i + 1];
    rgb[j + 2] = data[i + 2];
  }
  return rgb;
};

const encoder = new TextEncoder();
const push = (chunks, ...parts) => {
  for (const part of parts) {
    chunks.push(typeof part === 'string' ? encoder.encode(part) : part);
  }
};

const assemble = (chunks) => {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
};

const buildPdf = async (canvas) => {
  const { width, height } = canvas;
  const scale = Math.min((A4.width - PAGE_MARGIN * 2) / width, (A4.height - PAGE_MARGIN * 2) / height, SCALE_MAX);
  const drawW = +(width * scale).toFixed(2);
  const drawH = +(height * scale).toFixed(2);
  const x = +((A4.width - drawW) / 2).toFixed(2);
  const y = +((A4.height - drawH) / 2).toFixed(2);

  let imageBytes = canvasToRGB(canvas);
  let filter = '';
  const compressed = await deflate(imageBytes);
  if (compressed) {
    imageBytes = new Uint8Array(compressed);
    filter = '/Filter /FlateDecode';
  }

  const content = `q\n${drawW} 0 0 ${drawH} ${x} ${y} cm\n/Im1 Do\nQ\n`;
  const objects = [];

  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`;
  objects[3] =
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4.width} ${A4.height}] ` +
    `/Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>`;
  objects[4] = `<< /Length ${content.length} >>\nstream\n${content}endstream`;
  objects[5] =
    `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} ` +
    `/ColorSpace /DeviceRGB /BitsPerComponent 8 ${filter} /Length ${imageBytes.length} >>\nstream\n`;

  const chunks = [];
  const header = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  chunks.push(encoder.encode(header));

  const offsets = [];
  for (let i = 1; i <= 4; i += 1) {
    offsets[i] = chunks.reduce((sum, c) => sum + c.length, 0);
    push(chunks, `${i} 0 obj\n${objects[i]}\nendobj\n`);
  }
  offsets[5] = chunks.reduce((sum, c) => sum + c.length, 0);
  push(chunks, `5 0 obj\n${objects[5]}`);
  push(chunks, imageBytes);
  push(chunks, '\nendstream\nendobj\n');

  const xrefOffset = chunks.reduce((sum, c) => sum + c.length, 0);
  push(chunks, `xref\n0 6\n0000000000 65535 f \n`);
  for (let i = 1; i <= 5; i += 1) {
    push(chunks, `${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  push(chunks, `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return new Blob([assemble(chunks)], { type: 'application/pdf' });
};

const downloadPDF = async (canvas, filename) => {
  const blob = await buildPdf(canvas);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  return blob;
};

export const pdf = { buildPdf, downloadPDF };
