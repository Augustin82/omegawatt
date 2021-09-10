const fs = require("fs");

function walkSync(dir, filelist) {
  if (dir[dir.length - 1] !== "/") {
    dir = dir.concat("/");
  }

  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function (file) {
    const filepath = `${dir}${file}`;
    if (!file.startsWith("_")) {
      if (fs.statSync(filepath).isDirectory()) {
        filelist = walkSync(`${filepath}/`, filelist);
      } else {
        filelist.push(filepath);
      }
    }
  });
  return filelist;
}

function getCsvFiles(dirPath) {
  const files = [];
  walkSync(dirPath, files);
  return files.filter((file) => file.endsWith(".csv") || file.endsWith(".tsv"));
}

module.exports = getCsvFiles;
