const fs = require("fs");

function getProjectDirs(dir) {
  if (dir[dir.length - 1] != "/") {
    dir = dir.concat("/");
  }

  const files = fs.readdirSync(dir);
  const dirs = [];
  files.forEach(function (file) {
    if (fs.statSync(dir + file).isDirectory()) {
      dirs.push(dir + file);
    }
  });
  return dirs;
}

module.exports = { getProjectDirs };
