const dotenv = require("dotenv");
const path = require("path");
const { logger } = require("./lib");
const { buildMeasures } = require("./buildMeasures");
const { saveMeasures } = require("./saveMeasures");
const getCsvFiles = require("./lib/getCsvFiles");
const fs = require("fs");

dotenv.config();

const { DIR_PATH } = process.env;

function createFileIfNotExists(dirname) {
  if (fs.existsSync(dirname)) {
    logger.info(`Directory ${dirname} exists!`);
  } else {
    fs.mkdirSync(dirname);
    logger.info(`Directory ${dirname} created!`);
  }
}

const start = async (dirPath) => {
  logger.info(`start processing dir ${dirPath}`);

  const doneDir = path.join(dirPath, "done");
  const errorDir = path.join(dirPath, "error");

  createFileIfNotExists(path.join(dirPath, "done"));
  createFileIfNotExists(path.join(dirPath, "error"));

  const csvFiles = getCsvFiles(dirPath);

  for (let csvFile of csvFiles) {
    logger.info(`start processing file ${csvFile}`);
    const measures = await buildMeasures(csvFile);
    saveMeasures(measures)
      .then(() => {
        logger.info(`end processing file ${csvFile}`);
        fs.renameSync(csvFile, path.join(doneDir, path.basename(csvFile)));
      })
      .catch((err) => {
        logger.error(err);
        fs.renameSync(csvFile, path.join(errorDir, path.basename(csvFile)));
      });
  }
};

start(DIR_PATH);
