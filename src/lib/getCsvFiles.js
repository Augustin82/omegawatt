const fs = require("fs");

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

function getCsvFiles(dirPath) {
  const files = [];
  walkSync(dirPath, files);
  return files.filter((file) => file.endsWith(".csv"));
}

module.exports = getCsvFiles;
