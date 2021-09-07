const dotenv = require("dotenv");
const path = require("path");
const { logger, getProjectDirs, getDeviceDirs } = require("./lib");
const { getDeviceTable } = require("./parser/deviceTable");
const { buildMeasures } = require("./buildMeasures");
const { saveMeasures } = require("./saveMeasures");
const getCsvFiles = require("./lib/getCsvFiles");
const fs = require("fs");

dotenv.config();

const { CUSTOMERS } = process.env;
// CUSTOMERS=[{"bucket": "herbier","dirPath": "/home/herbierdudiois"}]
const customers = JSON.parse(CUSTOMERS || "[]");

const start = async (customer) => {
  const { bucket, dirPath: customerDir } = customer;

  logger.info(`start processing ${bucket}`);

  const projectDirs = getProjectDirs(customerDir);

  for (let projectDir of projectDirs) {
    const projectName = path.basename(projectDir);
    const deviceTable = await getDeviceTable(
      path.join(customerDir, projectName, "_device.name.csv")
    );

    const deviceDirs = getDeviceDirs(projectDir);

    for (let deviceDir of deviceDirs) {
      const errorDirName = path.join(deviceDir, "_error");
      const doneDirName = path.join(deviceDir, "_done");
      let errorDirExists = fs.existsSync(errorDirName);
      let doneDirExists = fs.existsSync(doneDirName);

      const csvFiles = getCsvFiles(deviceDir);

      for (let csvFile of csvFiles) {
        logger.info(`Start processing file ${csvFile}`);
        let measures;
        let error = false;

        try {
          measures = await buildMeasures(csvFile, deviceTable);
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
          if (!errorDirExists) {
            createFileIfNotExists(errorDirName);
            errorDirExists = true;
          }
          fs.renameSync(
            csvFile,
            path.join(errorDirName, path.basename(csvFile))
          );
        } else {
          if (!doneDirExists) {
            createFileIfNotExists(doneDirName);
            doneDirExists = true;
          }

          fs.renameSync(
            csvFile,
            path.join(doneDirName, path.basename(csvFile))
          );
        }
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
