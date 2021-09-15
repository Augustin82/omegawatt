const fs = require("fs");
const commandApi = require("../../influx/commandApi.js");

const readFile = (path) =>
  fs
    .readFileSync(path, {
      encoding: "utf8",
      flag: "r",
    })
    .replace("\n", "");

const runCommandInFile = (org, bucket, path) => {
  const command = readFile(path);
  commandApi.execute(org, bucket, command);
};

module.exports = { runCommandInFile };
