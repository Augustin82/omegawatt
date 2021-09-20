const { DateTime } = require("luxon");
const fs = require("fs");
const parse = require("csv-parse/lib/sync");

const { guessDelimiter } = require("../../lib");

const voltageOffset = 4;
const measuresOffset = 12;

const isAmountOfColumnsValid = (row) => {
  const length = row.length;
  if (length < voltageOffset + measuresOffset) {
    return false;
  }
  if ((length - voltageOffset - measuresOffset) % 12 !== 0) {
    return false;
  }
  return true;
};

const firstRowToMetadata = (fileContent, delimiter) => {
  const csvOptions = {
    delimiter,
    columns: false,
    to_line: 1,
    skip_empty_lines: true,
  };

  const rows = parse(fileContent, csvOptions);
  if (!rows || !rows.length) {
    throw Error("Could not find any data in the header!");
  }
  const row = rows[0];
  if (!row || !row.length) {
    throw Error("Could not find any data in the header!");
  }

  if (!isAmountOfColumnsValid(row)) {
    throw Error("Incorrect amount of columns");
  }

  const devices = [row[voltageOffset]];

  let offset = voltageOffset + measuresOffset;

  while (row[offset]) {
    devices.push(row[offset]);
    offset += measuresOffset;
  }

  return devices;
};

const getFileType = (row) => {
  const fileTypeString = row[0];
  if (!fileTypeString) {
    return null;
  }

  const regexp = /^MV_T(\d\d\d)_V...$/;

  const match = fileTypeString.match(regexp);

  return match && (match[1] || null);
};

const secondRowToFileType = (fileContent, delimiter) => {
  const csvOptions = {
    delimiter,
    columns: false,
    from_line: 2,
    to_line: 2,
    skip_empty_lines: true,
  };

  const rows = parse(fileContent, csvOptions);
  if (!rows || !rows.length) {
    throw Error("Could not find any data in the second header!");
  }
  const row = rows[0];
  if (!row || !row.length) {
    throw Error("Could not find any data in the second header!");
  }

  const fileType = getFileType(row);
  if (!fileType) {
    throw Error("Incorrect filetype");
  }
  return fileType;
};

const timestampToDate = (timestamp) => {
  // timestamp format for omegawatt:
  // DD/MM/YY HH:mm:ss
  // luxon equivalent:
  // dd/MM/yy HH:mm:ss

  if (!timestamp) {
    return null;
  }

  return DateTime.fromFormat(timestamp, "dd/MM/yy HH:mm:ss", {
    zone: "Europe/Paris",
  })
    .toUTC()
    .toISO();
};

const rowToMeasures = (metadata) => (row) => {
  const measures = [];
  const measured_at = timestampToDate(row[0]);
  if (!measured_at) {
    throw Error("Incorrect timestamp format");
  }
  const project = "project_name";
  let nature, measured_value;

  let offset = 1;

  while (row[offset]) {
    if (offset < 1) {
      // nope
    } else if (offset > 0 && offset < 4) {
      nature = `Ph${offset}`;
      measured_value = "V";
    } else {
      const columnForDevice = (offset - voltageOffset + 1) % 12;
      const voieNumber = ~~((columnForDevice - 1) / 2) + 1;
      nature = `Voie${voieNumber}`;
      measured_value = columnForDevice % 2 === 0 ? "Q" : "P";
    }
    const device_offset = ~~((offset - voltageOffset) / 12);
    const device_name = metadata[device_offset];
    const value = row[offset];
    const measure = {
      measured_at,
      nature,
      device_name,
      measured_value,
      value,
      project,
    };
    measures.push(measure);
    offset += 1;
  }

  return measures;
};

const otherRowsToMeasures = (fileContent, delimiter, metadata) => {
  const toMeasures = rowToMeasures(metadata);
  const csvOptions = {
    delimiter,
    columns: false,
    from_line: 3,
    skip_empty_lines: true,
  };

  const rows = parse(fileContent, csvOptions);

  const measures = rows.reduce((acc, row) => [...acc, ...toMeasures(row)], []);

  return measures;
};

/** @type {(filepath: string, delimiter?: string) => Promise<Record<any, any>[]>} */
const parseOmegawatt = async (filepath, delimiter = "\t") => {
  delimiter = delimiter || guessDelimiter(filepath);

  const fileContent = fs.readFileSync(filepath, {
    encoding: "utf8",
    flag: "r",
  });

  const _fileType = secondRowToFileType(fileContent, delimiter);

  const metadata = firstRowToMetadata(fileContent, delimiter);

  const measures = otherRowsToMeasures(fileContent, delimiter, metadata);

  return measures;
};

module.exports = {
  parseOmegawatt,
  timestampToDate,
};
