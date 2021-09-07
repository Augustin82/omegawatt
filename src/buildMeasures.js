const { logger } = require("./lib");
const { parseSocomec } = require("./parser/socomec");
const { parseOmegawatt } = require("./parser/omegawatt");

/**
 * @typedef {any} DeviceTable
 */

/**
 * @typedef {any} Measure
 */

/**
 * @type {(filepath: string, deviceTable: DeviceTable) => Promise<Measure[]> }
 */
const buildMeasures = async (filepath, deviceTable) => {
  let parser;

  if (filepath.toLowerCase().includes("socomec")) {
    parser = parseSocomec;
  } else {
    parser = parseOmegawatt;
  }

  const measures = await parser(filepath, deviceTable);
  logger.info(`${measures.length} measures in ${filepath}`);
  return measures;
};

module.exports = { buildMeasures };
