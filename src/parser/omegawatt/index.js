const fs = require("fs");
const parse = require("csv-parse/lib/sync");
const { parseOmegawattTime } = require("../../lib/dateHelpers.js");

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

/** @param {DeviceTable} deviceTable **/
const rowToMeasures = (metadata, deviceTable) => (row) => {
  const measures = [];
  const measured_at = parseOmegawattTime(row[0]);
  if (!measured_at) {
    throw Error("Incorrect timestamp format");
  }
  let channel, unit;

  let offset = 1;

  while (row[offset]) {
    let voieNumber;
    if (offset < 1) {
      // nope
    } else if (offset > 0 && offset < 4) {
      channel = `Ph${offset}`;
      unit = "V"; // "V"
    } else {
      const columnForDevice = (offset - voltageOffset + 1) % 12;
      voieNumber = ~~((columnForDevice - 1) / 2) + 1;
      channel = `Voie${voieNumber}`;
      unit = columnForDevice % 2 === 0 ? "Var" : "W"; // "Q" : "P"
    }
    const device_offset = ~~((offset - voltageOffset) / 12);
    const sn = metadata[device_offset];
    const {
      device_name,
      coeff,
      usage: _usage,
    } = deviceTable(sn, `${channel || ""}`, measured_at);
    const value = `${row[offset] * coeff}`;
    const measure = {
      measured_at,
      sn,
      channel,
      device_name,
      unit,
      measured_value: unit,
      value,
    };
    measures.push(measure);
    offset += 1;
  }

  return measures;
};

/** @param {DeviceTable} deviceTable **/
const otherRowsToMeasures = (fileContent, delimiter, deviceTable, metadata) => {
  const toMeasures = rowToMeasures(metadata, deviceTable);
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

/** @typedef {{ device_name: string, coeff: number, usage: string }} DeviceInfo **/
/** @typedef {(serialNumber: string, channel: string, timestamp: string) => DeviceInfo } DeviceTable **/

/** @type {(filepath: string, deviceTable: DeviceTable, delimiter?: string) => Promise<Record<any, any>[]>} */
const parseOmegawatt = async (filepath, deviceTable, delimiter = "\t") => {
  delimiter = delimiter || guessDelimiter(filepath);

  const fileContent = fs.readFileSync(filepath, {
    encoding: "utf8",
    flag: "r",
  });

  const _fileType = secondRowToFileType(fileContent, delimiter);

  const metadata = firstRowToMetadata(fileContent, delimiter);

  const measures = otherRowsToMeasures(
    fileContent,
    delimiter,
    deviceTable,
    metadata
  );

  return measures;
};

module.exports = {
  parseOmegawatt,
};
