const { logger } = require("./lib");
const { parseOmegawatt } = require("./parser/omegawatt");


/**
 * @typedef {any} Measure
 */

/**
 * @type {(filepath: string) => Promise<Measure[]> }
 */
const buildMeasures = async (filepath) => {

  const measures = await parseOmegawatt(filepath);
  logger.info(`${measures.length} measures in ${filepath}`);
  return measures;
};

module.exports = { buildMeasures };
