const fs = require("fs");
const parse = require("csv-parse/lib/sync");
const { parseOmegawattTime } = require("../../lib/dateHelpers.js");

const { guessDelimiter, logger } = require("../../lib");

const voltageOffset = 4;
const measuresOffset = 12;

const isAmountOfColumnsValid = (row) => {
  const length = row.length;
  logger.info(length)
  if (length < voltageOffset + measuresOffset) {
    return false;
  }
  // if ((length - voltageOffset - measuresOffset) % 12 !== 0) {
  //   console.log(length)
  //   return false;
  // }
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


const rowToMeasures = (metadata) => (row) => {
  const measures = [];
  const measured_at = parseOmegawattTime(row[0]);
  if (!measured_at) {
    throw Error("Incorrect timestamp format");
  }
  let channel,
    unit,
    measured_value,
    chan = "";

  let offset = 1;

  while (row[offset]) {
    let voieNumber;
    if (offset < 1) {
      // nope
    } else if (offset > 0 && offset < 4) {
      channel = `Ph${offset}`;
      chan = channel.toLowerCase();
      [measured_value, unit] = ["V", "V"];
    } else {
      const columnForDevice = (offset - voltageOffset + 1) % 12;
      voieNumber = ~~((columnForDevice - 1) / 2) + 1;
      channel = `Voie${voieNumber}`;
      chan = `${voieNumber || ""}`.toLowerCase();
      [measured_value, unit] =
        columnForDevice % 2 === 0 ? ["Q", "Var"] : ["P", "W"];
    }
    const device_offset = ~~((offset - voltageOffset) / 12);
    const sn = metadata[device_offset];
    
    const value = `${row[offset] * 1}`;
    const measure = {
      measured_at,
      sn,
      channel,
      measured_value,
      unit,
      value,
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

/** @type {(filepath: string) => Promise<Record<any, any>[]>} */
const parseOmegawatt = async (filepath) => {
  
  let delimiter = guessDelimiter(filepath);

  const fileContent = fs.readFileSync(filepath, {
    encoding: "utf8",
    flag: "r",
  });

  const _fileType = secondRowToFileType(fileContent, delimiter);
  logger.info(`fileType: ${_fileType}`)

  const metadata = firstRowToMetadata(fileContent, delimiter);

  const measures = otherRowsToMeasures(
    fileContent,
    delimiter,
    metadata
  );

  return measures;
};

module.exports = {
  parseOmegawatt,
};
