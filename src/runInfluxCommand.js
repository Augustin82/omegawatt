const dotenv = require("dotenv");
const { runCommandInFile } = require("./parser/commands");
const exit = require("process").exit.bind(this);

dotenv.config();

const args = process.argv.slice(2);

const showUsage = function () {
  console.log(
    "Usage: node runInfluxCommand.js BUCKET PATH/TO/FILE/CONTAINING/INFLUX/COMMAND"
  );
};

if (["-h", "--h", "-help", "--help"].includes(args[0])) {
  showUsage();
  exit(0);
}

if (args.length !== 2) {
  showUsage();
  exit(0);
} else {
  runCommandInFile(process.env.INFLUXDB_ORG, args[0], args[1]);
}
