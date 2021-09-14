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
  console.error("error", command.error);
  console.log("stdout ", command.stdout.toString());
  console.error("stderr ", command.stderr.toString());
};

module.exports = { execute };
