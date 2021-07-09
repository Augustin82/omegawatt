const fs = require("fs");

const { logger } = require("./lib");
const { parseCSV } = require("./parser");

const buildMeasures = async (filepath) => {
  if (filepath.includes("socomec")) {
    const measures = await parseCSV(filepath);
    logger.info(`${measures.length} measures in ${filepath}`);
    return measures;
  } else {
  }
  throw new Error(`Parser not found for ${filepath}`);
};

module.exports = { buildMeasures };
