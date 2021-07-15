const fs = require("fs");

function getProjectDirs(dir) {
  if (dir[dir.length - 1] !== "/") {
    dir = dir.concat("/");
  }

  const files = fs.readdirSync(dir);
  const dirs = [];
  files.forEach(function (file) {
    if(file !== "_done" && file !== "_error"){
      const filepath = `${dir}${file}`;
      if (fs.statSync(filepath).isDirectory()) {
        dirs.push(filepath);
      }
    }
  });
  return dirs;
}

module.exports = { getProjectDirs };
