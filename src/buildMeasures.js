const fs = require("fs");

const { logger } = require("./lib");
const { parseCSV } = require("./parser");

const buildMeasures = async (dirPath) => {
  const files = [];
  walkSync(dirPath, files);
  const csvFiles = files.filter((file) => file.endsWith(".csv"));
  const allMeasures = [];
  for (let file of csvFiles) {
    const measures = await processCSV(file);
    logger.info(`${measures.length} measures in ${file}`);
    Array.prototype.push.apply(allMeasures, measures);
  }

  logger.info(`${allMeasures.length} measures in total`);
  return allMeasures;
};

module.exports = { buildMeasures };

async function processCSV(filepath) {
  const measures = await parseCSV(filepath);

  //todo(tglatt): should be delete after end of processing
  //todo(tglatt): filename should be an influxdb tag
  fs.unlinkSync(filepath);

  return measures;
}

function walkSync(dir, filelist) {
  if (dir[dir.length - 1] != "/") dir = dir.concat("/");

  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function (file) {
    if (fs.statSync(dir + file).isDirectory()) {
      filelist = walkSync(dir + file + "/", filelist);
    } else {
      filelist.push(dir + file);
    }
  });
  return filelist;
}
