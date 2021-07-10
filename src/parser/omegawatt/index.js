const fs = require("fs");
const parse = require("csv-parse/lib/sync");

const { guessDelimiter } = require("../../lib");

const voltageOffset = 4;
const measuresOffset = 12;

const firstRowToMetadata = (fileContent, delimiter) => {
  const csvOptions = {
    delimiter,
    columns: false,
    to_line: 1,
    skip_empty_lines: true,
  };

  const row = parse(fileContent, csvOptions)[0];
  const devices = [row[voltageOffset]];

  let offset = voltageOffset + measuresOffset;

  while (row[offset]) {
    devices.push(row[offset]);
    offset += measuresOffset;
  }

  return devices;
};

const rowToMeasures = (metadata) => (row) => {
  const measures = [];
  const timestamp = row[0];
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
      timestamp,
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

/** @type {(filepath: string, delimiter?: string) => Promise<Record<any, any>[]>} **/
const parseOmegawatt = async (filepath, delimiter = "\t") => {
  delimiter = delimiter || guessDelimiter(filepath);

  const fileContent = fs.readFileSync(filepath, {
    encoding: "utf8",
    flag: "r",
  });

  const metadata = firstRowToMetadata(fileContent, delimiter);

  const measures = otherRowsToMeasures(fileContent, delimiter, metadata);

  return measures;
};

module.exports = {
  parseOmegawatt,
};
