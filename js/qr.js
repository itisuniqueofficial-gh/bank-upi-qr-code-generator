/*
 * UPI QR encoder — a self-contained QR Code (model 2) generator.
 *
 * Ported to an ES module from the MIT-licensed `qrcode-generator` library
 * (c) 2009 Kazuhiko Arase (https://github.com/kazuhikoarase/qrcode-generator).
 * Only the pieces needed for byte-mode encoding are included. No dependencies.
 */

const PAD0 = 0xec;
const PAD1 = 0x11;

const MODE = {
  NUMBER: 1 << 0,
  ALPHA_NUM: 1 << 1,
  BYTE: 1 << 2,
  KANJI: 1 << 3,
};

export const EC_LEVEL = { L: 1, M: 0, Q: 3, H: 2 };

const PATTERN_POSITION_TABLE = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170],
];

const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
const G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

// RS_BLOCK_TABLE — one triplet [count, total, data] per block group, ordered
// L, M, Q, H for each of the 40 versions. Ported from qrcode-generator.
const RS_BLOCK_TABLE = [
  [1, 26, 19],
  [1, 26, 16],
  [1, 26, 13],
  [1, 26, 9],
  [1, 44, 34],
  [1, 44, 28],
  [1, 44, 22],
  [1, 44, 16],
  [1, 70, 55],
  [1, 70, 44],
  [2, 35, 17],
  [2, 35, 13],
  [1, 100, 80],
  [2, 50, 32],
  [2, 50, 24],
  [4, 25, 9],
  [1, 134, 108],
  [2, 67, 43],
  [2, 33, 15, 2, 34, 16],
  [2, 33, 11, 2, 34, 12],
  [2, 86, 68],
  [4, 43, 27],
  [4, 43, 19],
  [4, 43, 15],
  [2, 98, 78],
  [4, 49, 31],
  [2, 32, 14, 4, 33, 15],
  [4, 39, 13, 1, 40, 14],
  [2, 121, 97],
  [2, 60, 38, 2, 61, 39],
  [4, 40, 18, 2, 41, 19],
  [4, 40, 14, 2, 41, 15],
  [2, 146, 116],
  [3, 58, 36, 2, 59, 37],
  [4, 36, 16, 4, 37, 17],
  [4, 36, 12, 4, 37, 13],
  [2, 86, 68, 2, 87, 69],
  [4, 69, 43, 1, 70, 44],
  [6, 43, 19, 2, 44, 20],
  [6, 43, 15, 2, 44, 16],
  [4, 101, 81],
  [1, 80, 50, 4, 81, 51],
  [4, 50, 22, 4, 51, 23],
  [3, 36, 12, 8, 37, 13],
  [2, 116, 92, 2, 117, 93],
  [6, 58, 36, 2, 59, 37],
  [4, 46, 20, 6, 47, 21],
  [7, 42, 14, 4, 43, 15],
  [4, 133, 107],
  [8, 59, 37, 1, 60, 38],
  [8, 44, 20, 4, 45, 21],
  [12, 33, 11, 4, 34, 12],
  [3, 145, 115, 1, 146, 116],
  [4, 64, 40, 5, 65, 41],
  [11, 36, 16, 5, 37, 17],
  [11, 36, 12, 5, 37, 13],
  [5, 109, 87, 1, 110, 88],
  [5, 65, 41, 5, 66, 42],
  [5, 54, 24, 7, 55, 25],
  [11, 36, 12, 7, 37, 13],
  [5, 122, 98, 1, 123, 99],
  [7, 73, 45, 3, 74, 46],
  [15, 43, 19, 2, 44, 20],
  [3, 45, 15, 13, 46, 16],
  [1, 135, 107, 5, 136, 108],
  [10, 74, 46, 1, 75, 47],
  [1, 50, 22, 15, 51, 23],
  [2, 42, 14, 17, 43, 15],
  [5, 150, 120, 1, 151, 121],
  [9, 69, 43, 4, 70, 44],
  [17, 50, 22, 1, 51, 23],
  [2, 42, 14, 19, 43, 15],
  [3, 141, 113, 4, 142, 114],
  [3, 70, 44, 11, 71, 45],
  [17, 47, 21, 4, 48, 22],
  [9, 39, 13, 16, 40, 14],
  [3, 135, 107, 5, 136, 108],
  [3, 67, 41, 13, 68, 42],
  [15, 54, 24, 5, 55, 25],
  [15, 43, 15, 10, 44, 16],
  [4, 144, 116, 4, 145, 117],
  [17, 68, 42],
  [17, 50, 22, 6, 51, 23],
  [19, 46, 16, 6, 47, 17],
  [2, 139, 111, 7, 140, 112],
  [17, 74, 46],
  [7, 54, 24, 16, 55, 25],
  [34, 37, 13],
  [4, 151, 121, 5, 152, 122],
  [4, 75, 47, 14, 76, 48],
  [11, 54, 24, 14, 55, 25],
  [16, 45, 15, 14, 46, 16],
  [6, 147, 117, 4, 148, 118],
  [6, 73, 45, 14, 74, 46],
  [11, 54, 24, 16, 55, 25],
  [30, 46, 16, 2, 47, 17],
  [8, 132, 106, 4, 133, 107],
  [8, 75, 47, 13, 76, 48],
  [7, 54, 24, 22, 55, 25],
  [22, 45, 15, 13, 46, 16],
  [10, 142, 114, 2, 143, 115],
  [19, 74, 46, 4, 75, 47],
  [28, 50, 22, 6, 51, 23],
  [33, 46, 16, 4, 47, 17],
  [8, 152, 122, 4, 153, 123],
  [22, 73, 45, 3, 74, 46],
  [8, 53, 23, 26, 54, 24],
  [12, 45, 15, 28, 46, 16],
  [3, 147, 117, 10, 148, 118],
  [3, 73, 45, 23, 74, 46],
  [4, 54, 24, 31, 55, 25],
  [11, 45, 15, 31, 46, 16],
  [7, 146, 116, 7, 147, 117],
  [21, 73, 45, 7, 74, 46],
  [1, 53, 23, 37, 54, 24],
  [19, 45, 15, 26, 46, 16],
  [5, 145, 115, 10, 146, 116],
  [19, 75, 47, 10, 76, 48],
  [15, 54, 24, 25, 55, 25],
  [23, 45, 15, 25, 46, 16],
  [13, 145, 115, 3, 146, 116],
  [2, 74, 46, 29, 75, 47],
  [42, 54, 24, 1, 55, 25],
  [23, 45, 15, 28, 46, 16],
  [17, 145, 115],
  [10, 74, 46, 23, 75, 47],
  [10, 54, 24, 35, 55, 25],
  [19, 45, 15, 35, 46, 16],
  [17, 145, 115, 1, 146, 116],
  [14, 74, 46, 21, 75, 47],
  [29, 54, 24, 19, 55, 25],
  [11, 45, 15, 46, 46, 16],
  [13, 145, 115, 6, 146, 116],
  [14, 74, 46, 23, 75, 47],
  [44, 54, 24, 7, 55, 25],
  [59, 46, 16, 1, 47, 17],
  [12, 151, 121, 7, 152, 122],
  [12, 75, 47, 26, 76, 48],
  [39, 54, 24, 14, 55, 25],
  [22, 45, 15, 41, 46, 16],
  [6, 151, 121, 14, 152, 122],
  [6, 75, 47, 34, 76, 48],
  [46, 54, 24, 10, 55, 25],
  [2, 45, 15, 64, 46, 16],
  [17, 152, 122, 4, 153, 123],
  [29, 74, 46, 14, 75, 47],
  [49, 54, 24, 10, 55, 25],
  [24, 45, 15, 46, 46, 16],
  [4, 152, 122, 18, 153, 123],
  [13, 74, 46, 32, 75, 47],
  [48, 54, 24, 14, 55, 25],
  [42, 45, 15, 32, 46, 16],
  [20, 147, 117, 4, 148, 118],
  [40, 75, 47, 7, 76, 48],
  [43, 54, 24, 22, 55, 25],
  [10, 45, 15, 67, 46, 16],
  [19, 148, 118, 6, 149, 119],
  [18, 75, 47, 31, 76, 48],
  [34, 54, 24, 34, 55, 25],
  [20, 45, 15, 61, 46, 16],
];

const LEVEL_TABLE_INDEX = { [EC_LEVEL.L]: 0, [EC_LEVEL.M]: 1, [EC_LEVEL.Q]: 2, [EC_LEVEL.H]: 3 };
const RS_BLOCK_TABLE_OFFSET = (version, level) => (version - 1) * 4 + LEVEL_TABLE_INDEX[level];

const MASK_FUNCS = [
  (i, j) => (i + j) % 2 === 0,
  (i, j) => i % 2 === 0,
  (i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
  (i, j) => (((i * j) % 3) + ((i + j) % 2)) % 2 === 0,
];

const EXP_TABLE = new Array(256);
const LOG_TABLE = new Array(256);
for (let i = 0; i < 8; i += 1) EXP_TABLE[i] = 1 << i;
for (let i = 8; i < 256; i += 1) {
  EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
}
for (let i = 0; i < 255; i += 1) LOG_TABLE[EXP_TABLE[i]] = i;

const glog = (n) => LOG_TABLE[n];
const gexp = (n) => {
  while (n < 0) n += 255;
  while (n >= 256) n -= 255;
  return EXP_TABLE[n];
};

class Polynomial {
  constructor(num, shift) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset += 1;
    const length = num.length - offset + (shift || 0);
    this._num = new Array(length);
    for (let i = 0; i < num.length - offset; i += 1) this._num[i] = num[i + offset];
  }

  getAt(index) {
    return this._num[index];
  }

  getLength() {
    return this._num.length;
  }

  multiply(e) {
    const num = new Array(this.getLength() + e.getLength() - 1);
    for (let i = 0; i < this.getLength(); i += 1) {
      for (let j = 0; j < e.getLength(); j += 1) {
        num[i + j] ^= gexp(glog(this.getAt(i)) + glog(e.getAt(j)));
      }
    }
    return new Polynomial(num, 0);
  }

  mod(e) {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = glog(this.getAt(0)) - glog(e.getAt(0));
    const num = this._num.slice();
    for (let i = 0; i < e.getLength(); i += 1) {
      num[i] ^= gexp(glog(e.getAt(i)) + ratio);
    }
    return new Polynomial(num, 0).mod(e);
  }
}

const getBCHDigit = (data) => {
  let digit = 0;
  while (data !== 0) {
    digit += 1;
    data >>>= 1;
  }
  return digit;
};

const getBCHTypeInfo = (data) => {
  let d = data << 10;
  while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
    d ^= G15 << (getBCHDigit(d) - getBCHDigit(G15));
  }
  return ((data << 10) | d) ^ G15_MASK;
};

const getBCHTypeNumber = (data) => {
  let d = data << 12;
  while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
    d ^= G18 << (getBCHDigit(d) - getBCHDigit(G18));
  }
  return (data << 12) | d;
};

const getErrorCorrectPolynomial = (length) => {
  let a = new Polynomial([1], 0);
  for (let i = 0; i < length; i += 1) {
    a = a.multiply(new Polynomial([1, gexp(i)], 0));
  }
  return a;
};

const getLengthInBits = (mode, type) => {
  if (1 <= type && type < 10) {
    switch (mode) {
      case MODE.NUMBER:
        return 10;
      case MODE.ALPHA_NUM:
        return 9;
      case MODE.BYTE:
        return 8;
      case MODE.KANJI:
        return 8;
      default:
        throw new Error(`mode:${mode}`);
    }
  } else if (type < 27) {
    switch (mode) {
      case MODE.NUMBER:
        return 12;
      case MODE.ALPHA_NUM:
        return 11;
      case MODE.BYTE:
        return 16;
      case MODE.KANJI:
        return 10;
      default:
        throw new Error(`mode:${mode}`);
    }
  } else if (type < 41) {
    switch (mode) {
      case MODE.NUMBER:
        return 14;
      case MODE.ALPHA_NUM:
        return 13;
      case MODE.BYTE:
        return 16;
      case MODE.KANJI:
        return 12;
      default:
        throw new Error(`mode:${mode}`);
    }
  }
  throw new Error(`type:${type}`);
};

const getRsBlocks = (typeNumber, level) => {
  const rsBlock = RS_BLOCK_TABLE[RS_BLOCK_TABLE_OFFSET(typeNumber, level)];
  if (!rsBlock) throw new Error(`bad rs block @ typeNumber:${typeNumber}/errorCorrectionLevel:${level}`);
  const list = [];
  for (let i = 0; i < rsBlock.length / 3; i += 1) {
    const count = rsBlock[i * 3 + 0];
    const totalCount = rsBlock[i * 3 + 1];
    const dataCount = rsBlock[i * 3 + 2];
    for (let j = 0; j < count; j += 1) {
      list.push({ totalCount, dataCount });
    }
  }
  return list;
};

class BitBuffer {
  constructor() {
    this._buffer = [];
    this._length = 0;
  }

  getBuffer() {
    return this._buffer;
  }

  put(num, length) {
    for (let i = 0; i < length; i += 1) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }

  getLengthInBits() {
    return this._length;
  }

  putBit(bit) {
    const bufIndex = Math.floor(this._length / 8);
    if (this._buffer.length <= bufIndex) this._buffer.push(0);
    if (bit) this._buffer[bufIndex] |= 0x80 >>> (this._length % 8);
    this._length += 1;
  }
}

const createBytes = (buffer, rsBlocks) => {
  let offset = 0;
  let maxDcCount = 0;
  let maxEcCount = 0;
  const dcdata = new Array(rsBlocks.length);
  const ecdata = new Array(rsBlocks.length);
  const buf = buffer.getBuffer();

  for (let r = 0; r < rsBlocks.length; r += 1) {
    const dcCount = rsBlocks[r].dataCount;
    const ecCount = rsBlocks[r].totalCount - dcCount;
    maxDcCount = Math.max(maxDcCount, dcCount);
    maxEcCount = Math.max(maxEcCount, ecCount);

    dcdata[r] = new Array(dcCount);
    for (let i = 0; i < dcdata[r].length; i += 1) {
      dcdata[r][i] = 0xff & buf[i + offset];
    }
    offset += dcCount;

    const rsPoly = getErrorCorrectPolynomial(ecCount);
    const rawPoly = new Polynomial(dcdata[r], rsPoly.getLength() - 1);
    const modPoly = rawPoly.mod(rsPoly);
    ecdata[r] = new Array(rsPoly.getLength() - 1);
    for (let i = 0; i < ecdata[r].length; i += 1) {
      const modIndex = i + modPoly.getLength() - ecdata[r].length;
      ecdata[r][i] = modIndex >= 0 ? modPoly.getAt(modIndex) : 0;
    }
  }

  let totalCodeCount = 0;
  for (let i = 0; i < rsBlocks.length; i += 1) totalCodeCount += rsBlocks[i].totalCount;

  const data = new Array(totalCodeCount);
  let index = 0;
  for (let i = 0; i < maxDcCount; i += 1) {
    for (let r = 0; r < rsBlocks.length; r += 1) {
      if (i < dcdata[r].length) {
        data[index] = dcdata[r][i];
        index += 1;
      }
    }
  }
  for (let i = 0; i < maxEcCount; i += 1) {
    for (let r = 0; r < rsBlocks.length; r += 1) {
      if (i < ecdata[r].length) {
        data[index] = ecdata[r][i];
        index += 1;
      }
    }
  }
  return data;
};

const createData = (typeNumber, level, bytes) => {
  const rsBlocks = getRsBlocks(typeNumber, level);
  const buffer = new BitBuffer();

  buffer.put(MODE.BYTE, 4);
  buffer.put(bytes.length, getLengthInBits(MODE.BYTE, typeNumber));
  for (let i = 0; i < bytes.length; i += 1) buffer.put(bytes[i], 8);

  let totalDataCount = 0;
  for (let i = 0; i < rsBlocks.length; i += 1) totalDataCount += rsBlocks[i].dataCount;

  const totalBits = totalDataCount * 8;
  if (buffer.getLengthInBits() > totalBits) {
    throw new Error(`code length overflow. (${buffer.getLengthInBits()}>${totalBits})`);
  }

  if (buffer.getLengthInBits() + 4 <= totalBits) buffer.put(0, 4);
  while (buffer.getLengthInBits() % 8 !== 0) buffer.putBit(false);
  while (true) {
    if (buffer.getLengthInBits() >= totalBits) break;
    buffer.put(PAD0, 8);
    if (buffer.getLengthInBits() >= totalBits) break;
    buffer.put(PAD1, 8);
  }

  return createBytes(buffer, rsBlocks);
};

const getLostPoint = (moduleCount, isDark) => {
  let lostPoint = 0;

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      let sameCount = 0;
      const dark = isDark(row, col);
      for (let r = -1; r <= 1; r += 1) {
        if (row + r < 0 || moduleCount <= row + r) continue;
        for (let c = -1; c <= 1; c += 1) {
          if (col + c < 0 || moduleCount <= col + c) continue;
          if (r === 0 && c === 0) continue;
          if (dark === isDark(row + r, col + c)) sameCount += 1;
        }
      }
      if (sameCount > 5) lostPoint += 3 + sameCount - 5;
    }
  }

  for (let row = 0; row < moduleCount - 1; row += 1) {
    for (let col = 0; col < moduleCount - 1; col += 1) {
      let count = 0;
      if (isDark(row, col)) count += 1;
      if (isDark(row + 1, col)) count += 1;
      if (isDark(row, col + 1)) count += 1;
      if (isDark(row + 1, col + 1)) count += 1;
      if (count === 0 || count === 4) lostPoint += 3;
    }
  }

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount - 6; col += 1) {
      if (
        isDark(row, col) &&
        !isDark(row, col + 1) &&
        isDark(row, col + 2) &&
        isDark(row, col + 3) &&
        isDark(row, col + 4) &&
        !isDark(row, col + 5) &&
        isDark(row, col + 6)
      ) {
        lostPoint += 40;
      }
    }
  }
  for (let col = 0; col < moduleCount; col += 1) {
    for (let row = 0; row < moduleCount - 6; row += 1) {
      if (
        isDark(row, col) &&
        !isDark(row + 1, col) &&
        isDark(row + 2, col) &&
        isDark(row + 3, col) &&
        isDark(row + 4, col) &&
        !isDark(row + 5, col) &&
        isDark(row + 6, col)
      ) {
        lostPoint += 40;
      }
    }
  }

  let darkCount = 0;
  for (let col = 0; col < moduleCount; col += 1) {
    for (let row = 0; row < moduleCount; row += 1) {
      if (isDark(row, col)) darkCount += 1;
    }
  }
  const ratio = Math.abs((100 * darkCount) / moduleCount / moduleCount - 50) / 5;
  lostPoint += ratio * 10;

  return lostPoint;
};

const utf8ToBytes = (str) => {
  const utf8 = [];
  for (let i = 0; i < str.length; i += 1) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) {
      utf8.push(charcode);
    } else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      i += 1;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return utf8;
};

class QRCode {
  constructor(typeNumber, level) {
    this._typeNumber = typeNumber;
    this._level = level;
    this._modules = null;
    this._moduleCount = 0;
    this._dataCache = null;
    this._dataList = [];
  }

  addData(data) {
    this._dataList.push(utf8ToBytes(data));
    this._dataCache = null;
  }

  getModuleCount() {
    return this._moduleCount;
  }

  isDark(row, col) {
    return this._modules[row][col] === true;
  }

  getBestMaskPattern() {
    let minLostPoint = 0;
    let pattern = 0;
    for (let i = 0; i < 8; i += 1) {
      this.makeImpl(true, i);
      const lostPoint = getLostPoint(this._moduleCount, (r, c) => this.isDark(r, c));
      if (i === 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }
    return pattern;
  }

  make() {
    this.makeImpl(false, this.getBestMaskPattern());
  }

  makeImpl(test, maskPattern) {
    this._moduleCount = this._typeNumber * 4 + 17;
    this._modules = new Array(this._moduleCount);
    for (let row = 0; row < this._moduleCount; row += 1) {
      this._modules[row] = new Array(this._moduleCount);
      for (let col = 0; col < this._moduleCount; col += 1) this._modules[row][col] = null;
    }

    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this._moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this._moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);
    if (this._typeNumber >= 7) this.setupTypeNumber(test);

    if (this._dataCache == null) {
      this._dataCache = createData(this._typeNumber, this._level, this._dataList.flat());
    }
    this.mapData(this._dataCache, maskPattern);
  }

  setupPositionProbePattern(row, col) {
    for (let r = -1; r <= 7; r += 1) {
      if (row + r <= -1 || this._moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c += 1) {
        if (col + c <= -1 || this._moduleCount <= col + c) continue;
        if (
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        ) {
          this._modules[row + r][col + c] = true;
        } else {
          this._modules[row + r][col + c] = false;
        }
      }
    }
  }

  setupTimingPattern() {
    for (let r = 8; r < this._moduleCount - 8; r += 1) {
      if (this._modules[r][6] != null) continue;
      this._modules[r][6] = r % 2 === 0;
    }
    for (let c = 8; c < this._moduleCount - 8; c += 1) {
      if (this._modules[6][c] != null) continue;
      this._modules[6][c] = c % 2 === 0;
    }
  }

  setupPositionAdjustPattern() {
    const pos = PATTERN_POSITION_TABLE[this._typeNumber - 1];
    for (let i = 0; i < pos.length; i += 1) {
      for (let j = 0; j < pos.length; j += 1) {
        const row = pos[i];
        const col = pos[j];
        if (this._modules[row][col] != null) continue;
        for (let r = -2; r <= 2; r += 1) {
          for (let c = -2; c <= 2; c += 1) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
              this._modules[row + r][col + c] = true;
            } else {
              this._modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  }

  setupTypeNumber(test) {
    const bits = getBCHTypeNumber(this._typeNumber);
    for (let i = 0; i < 18; i += 1) {
      const mod = !test && ((bits >> i) & 1) === 1;
      this._modules[Math.floor(i / 3)][(i % 3) + this._moduleCount - 8 - 3] = mod;
    }
    for (let i = 0; i < 18; i += 1) {
      const mod = !test && ((bits >> i) & 1) === 1;
      this._modules[(i % 3) + this._moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    }
  }

  setupTypeInfo(test, maskPattern) {
    const data = (this._level << 3) | maskPattern;
    const bits = getBCHTypeInfo(data);
    for (let i = 0; i < 15; i += 1) {
      const mod = !test && ((bits >> i) & 1) === 1;
      if (i < 6) {
        this._modules[i][8] = mod;
      } else if (i < 8) {
        this._modules[i + 1][8] = mod;
      } else {
        this._modules[this._moduleCount - 15 + i][8] = mod;
      }
    }
    for (let i = 0; i < 15; i += 1) {
      const mod = !test && ((bits >> i) & 1) === 1;
      if (i < 8) {
        this._modules[8][this._moduleCount - i - 1] = mod;
      } else if (i < 9) {
        this._modules[8][15 - i - 1 + 1] = mod;
      } else {
        this._modules[8][15 - i - 1] = mod;
      }
    }
    this._modules[this._moduleCount - 8][8] = !test;
  }

  mapData(data, maskPattern) {
    let inc = -1;
    let row = this._moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;
    const maskFunc = MASK_FUNCS[maskPattern];

    for (let col = this._moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col -= 1;
      while (true) {
        for (let c = 0; c < 2; c += 1) {
          if (this._modules[row][col - c] == null) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
            }
            if (maskFunc(row, col - c)) dark = !dark;
            this._modules[row][col - c] = dark;
            bitIndex -= 1;
            if (bitIndex === -1) {
              byteIndex += 1;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || this._moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  getModules() {
    const count = this._moduleCount;
    const out = new Array(count);
    for (let row = 0; row < count; row += 1) {
      out[row] = new Array(count);
      for (let col = 0; col < count; col += 1) out[row][col] = this.isDark(row, col);
    }
    return out;
  }
}

const byteCount = (bytes) => bytes.length;

const findVersion = (bytes, level, minVersion, maxVersion) => {
  const lo = Math.max(1, minVersion || 1);
  const hi = Math.min(40, maxVersion || 40);
  for (let version = lo; version <= hi; version += 1) {
    let totalDataCount = 0;
    const blocks = getRsBlocks(version, level);
    for (let i = 0; i < blocks.length; i += 1) totalDataCount += blocks[i].dataCount;
    const headerBits = 4 + getLengthInBits(MODE.BYTE, version);
    const capacityBytes = Math.floor((totalDataCount * 8 - headerBits) / 8);
    if (byteCount(bytes) <= capacityBytes) return version;
  }
  return -1;
};

/**
 * Generate a QR code from a string.
 * @param {string} data - text to encode (byte mode, UTF-8).
 * @param {object} [options]
 * @param {'L'|'M'|'Q'|'H'} [options.level='M'] - error correction level.
 * @param {number} [options.minVersion=1] - smallest allowed version.
 * @param {number} [options.maxVersion=40] - largest allowed version.
 * @returns {{ getModules: () => boolean[][], getModuleCount: () => number,
 *            getVersion: () => number, getLevel: () => string }}
 */
export function createQR(data, options = {}) {
  const levelName = (options.level || 'M').toUpperCase();
  const level = EC_LEVEL[levelName];
  if (level === undefined) throw new Error(`unknown EC level: ${options.level}`);
  const bytes = utf8ToBytes(String(data));
  const version = findVersion(bytes, level, options.minVersion, options.maxVersion);
  if (version === -1) {
    throw new Error(`data too long to fit in QR version ${options.maxVersion || 40} (${levelName})`);
  }
  const qr = new QRCode(version, level);
  qr.addData(String(data));
  qr.make();
  return {
    isDark: (row, col) => qr.isDark(row, col),
    getModules: () => qr.getModules(),
    getModuleCount: () => qr.getModuleCount(),
    getVersion: () => qr._typeNumber,
    getLevel: () => levelName,
    getLevelValue: () => level,
  };
}

export { utf8ToBytes };
