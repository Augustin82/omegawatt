const fs = require("fs");

function addTrailingSlashIfNeeded(directory) {
  if (directory[directory.length - 1] !== "/") {
    directory = directory.concat("/");
  }
  return directory;
}

function getSubDirs(customerDir) {
  customerDir = addTrailingSlashIfNeeded(customerDir);

  const files = fs.readdirSync(customerDir);
  const projectDirs = [];
  files.forEach(function (file) {
    const projectDir = `${customerDir}${file}`;
    if (!projectDir.startsWith("_") && fs.statSync(projectDir).isDirectory()) {
      projectDirs.push(projectDir);
    }
  });
  return projectDirs;
}

const getProjectDirs = getSubDirs;
const getDeviceDirs = getSubDirs;

module.exports = { getProjectDirs, getDeviceDirs };
