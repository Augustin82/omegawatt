const dotenv = require("dotenv");
const path = require("path");
const { logger, getProjectDirs } = require("./lib");
const { buildMeasures } = require("./buildMeasures");
const { saveMeasures } = require("./saveMeasures");
const getCsvFiles = require("./lib/getCsvFiles");
const fs = require("fs");

dotenv.config();

const { CUSTOMERS } = process.env;
const customers = JSON.parse(CUSTOMERS || "[]");

const start = async (customer) => {
  const { bucket, dirPath } = customer;

  logger.info(`start processing ${bucket}`);

  const projectDirs = getProjectDirs(dirPath);

  for (let projectDir of projectDirs) {
    const projectName = path.basename(projectDir);

    createFileIfNotExists(path.join(dirPath, projectName, "_done"));
    createFileIfNotExists(path.join(dirPath, projectName, "_error"));

    const csvFiles = getCsvFiles(projectDir);

    for (let csvFile of csvFiles) {
      logger.info(`Start processing file ${csvFile}`);
      let measures;
      let error = false;
      try {
        measures = await buildMeasures(csvFile);
        try {
          await saveMeasures(customer, projectName, measures);
          logger.info(`Success processing ${csvFile}`);
        } catch (err) {
          error = true;
          logger.error("Error when saving measures", err);
        }
      } catch (err) {
        error = true;
        logger.error("Error when building measures", err);
      }

      if (error) {
        fs.renameSync(
          csvFile,
          path.join(dirPath, projectName, "_error", path.basename(csvFile))
        );
      } else {
        fs.renameSync(
          csvFile,
          path.join(dirPath, projectName, "_done", path.basename(csvFile))
        );
      }
    }
  }
};

for (let customer of customers) {
  void start(customer);
}

function createFileIfNotExists(dirname) {
  if (fs.existsSync(dirname)) {
    logger.info(`Directory ${dirname} exists!`);
  } else {
    fs.mkdirSync(dirname);
    logger.info(`Directory ${dirname} created!`);
  }
}
