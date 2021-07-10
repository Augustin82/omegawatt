const { logger } = require("./lib");
const { parseSocomec } = require("./parser/socomec");
const { parseOmegawatt } = require("./parser/omegawatt");

/**
 * @typedef {any} Measure
 **/

/**
 * @type {(filepath: string) => Promise<Measure[]> }
 **/
const buildMeasures = async (filepath) => {
  let parser;

  if (filepath.includes("socomec")) {
    parser = parseSocomec;
  } else {
    parser = parseOmegawatt;
  }

  const measures = await parser(filepath);
  logger.info(`${measures.length} measures in ${filepath}`);
  return measures;
};

module.exports = { buildMeasures };
