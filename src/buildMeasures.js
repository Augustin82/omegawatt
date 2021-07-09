const fs = require("fs");

const { logger } = require("./lib");
const { parseCSV } = require("./parser");

const buildMeasures = async (filepath) => {
  const measures = await parseCSV(filepath);
  logger.info(`${measures.length} measures in ${filepath}`);
  return measures;
};

module.exports = { buildMeasures };
