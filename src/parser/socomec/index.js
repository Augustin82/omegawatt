const fs = require("fs");

const { CSVToArray, guessDelimiter } = require("../../lib");

const { parseMeasure } = require("./parseMeasure");
const { parseMeasuresMetadata } = require("./parseMeasuresMetadata");
const { parseMainHeading } = require("./parseMainHeading");
const { DEVICE_NAME, METADATA_KEY } = require("../constant");

const parseSocomec = async (filepath, delimiter) => {
  delimiter = delimiter || guessDelimiter(filepath);

  const metadatas = {
    [DEVICE_NAME]: "",
    measureMetadatas: [],
  };

  const fileContent = fs.readFileSync(filepath, {
    encoding: "utf8",
    flag: "r",
  });

  const rows = CSVToArray(fileContent, delimiter);

  const measures = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) {
      continue;
    } else if (i === 1) {
      await parseMainHeading(row, metadatas);
    } else if (i >= 3 && i <= 8) {
      await parseMeasuresMetadata(row, metadatas);
    } else if (i >= 9) {
      //TODO: should be an array of measures
      const measure = await parseMeasure(row, metadatas);
      if (measure) {
        measures.push(measure);
      }
    }
  }
  return measures;
};

module.exports = {
  parseSocomec,
  DEVICE_NAME,
  METADATA_KEY,
};