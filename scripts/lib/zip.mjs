// Minimal ZIP writer for reference-data bundles: no dependency, and byte-stable
// across rebuilds on the same Node version. Extracted verbatim from
// scripts/convert-sedimentation-data.mjs, which keeps its own copy.
//
// createStoredZip writes the entries uncompressed. createDeflatedZip deflates
// them, which is worth it for bundles of plain-text numbers: the FSI reference
// files go from 4.8 MB to 1.2 MB. Converters run by hand, so the committed zip
// is the artifact; a different zlib build would only change it at the next run.

import { deflateRawSync } from "node:zlib";

export function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date("2026-01-01T00:00:00Z")) {
  const year = Math.max(date.getUTCFullYear(), 1980);
  const dosTime = (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate();
  return { dosDate, dosTime };
}

function writeUInt16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function writeUInt32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0);
  return buffer;
}

export function createStoredZip(entries) {
  return createZip(entries, { compress: false });
}

export function createDeflatedZip(entries) {
  return createZip(entries, { compress: true });
}

function createZip(entries, { compress }) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { dosDate, dosTime } = dosDateTime();

  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const data = entry.data;
    // The CRC and the uncompressed size always describe the original bytes.
    const crc = crc32(data);
    const payload = compress ? deflateRawSync(data, { level: 9 }) : data;
    const method = compress ? 8 : 0;
    const localHeader = Buffer.concat([
      writeUInt32(0x04034b50),
      writeUInt16(20),
      writeUInt16(0),
      writeUInt16(method),
      writeUInt16(dosTime),
      writeUInt16(dosDate),
      writeUInt32(crc),
      writeUInt32(payload.length),
      writeUInt32(data.length),
      writeUInt16(name.length),
      writeUInt16(0),
      name
    ]);
    localParts.push(localHeader, payload);
    centralParts.push(Buffer.concat([
      writeUInt32(0x02014b50),
      writeUInt16(20),
      writeUInt16(20),
      writeUInt16(0),
      writeUInt16(method),
      writeUInt16(dosTime),
      writeUInt16(dosDate),
      writeUInt32(crc),
      writeUInt32(payload.length),
      writeUInt32(data.length),
      writeUInt16(name.length),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt32(0),
      writeUInt32(offset),
      name
    ]));
    offset += localHeader.length + payload.length;
  }

  const central = Buffer.concat(centralParts);
  return Buffer.concat([
    ...localParts,
    central,
    writeUInt32(0x06054b50),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(entries.length),
    writeUInt16(entries.length),
    writeUInt32(central.length),
    writeUInt32(offset),
    writeUInt16(0)
  ]);
}
