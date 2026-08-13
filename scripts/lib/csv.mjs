// Minimal RFC 4180 CSV reader. The DNS validation datasheet quotes any field
// containing commas or newlines, so a naive split is not enough.

/** Parse CSV text into an array of row arrays. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      quoted = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      endField();
      i += 1;
      continue;
    }
    if (char === "\r") {
      i += 1;
      continue;
    }
    if (char === "\n") {
      endRow();
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  if (field.length || row.length) endRow();
  return rows.filter(entry => entry.length > 1 || entry[0] !== "");
}

/** Parse CSV text into objects keyed by the header row. */
export function parseCsvRecords(text) {
  const [header, ...body] = parseCsv(text);
  if (!header) return [];
  return body.map(cells =>
    Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""]))
  );
}
