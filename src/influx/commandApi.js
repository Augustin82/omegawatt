const { logger } = require("../lib");
const { spawnSync } = require("child_process");

const execute = (org, bucket, influxCommand) => {
  // stderr is sent to stdout of parent process
  // you can set options.stdio if you want it to go elsewhere
  const dockerExec = "docker";
  const dockerArgs = "exec -t influxdb".split(" ");
  const influxArgs = influxCommand.split(" ");
  const command = spawnSync(dockerExec, [
    ...dockerArgs,
    ...influxArgs,
    "--org",
    org,
    "--bucket",
    bucket,
  ]);
  logger.error("error", command.error);
  logger.info("stdout ", command.stdout.toString());
  logger.error("stderr ", command.stderr.toString());
};

module.exports = { execute };
