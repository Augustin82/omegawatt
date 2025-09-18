const { logger } = require("./lib");
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
  const parser = parseOmegawatt

  const measures = await parser(filepath, deviceTable);
  logger.info(`${measures.length} measures in ${filepath}`);
  return measures;
};

module.exports = { buildMeasures };
