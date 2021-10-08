const { Point } = require("@influxdata/influxdb-client");
const { isInt, logger } = require("./lib");
const { createWriteApi } = require("./influx/index");

async function saveMeasures(customer, projectName, measures) {
  const { bucket } = customer;

  const writeApi = createWriteApi(bucket);

  let points = [];
  for (let measure of measures) {
    const value = measure.value;
    console.log("value", { value });
    if (isInt(value)) {
      const point = new Point(measure.measured_value)
        .timestamp(new Date(measure.measured_at))
        .tag("device_name", measure.device_name)
        .tag("channel", measure.channel)
        .tag("sn", measure.sn)
        .tag("usage", measure.usage)
        .tag("project", projectName)
        .tag("unit", measure.unit)
        .floatField("value", value);
      points.push(point);
    }
    if (points.length > 1000) {
      writeApi.writePoints(points);
      await writeApi.flush();
      points = [];
    }
  }

  if (points.length > 0) {
    writeApi.writePoints(points);
    await writeApi.flush();
  }

  await writeApi
    .close()
    .then(() => {
      logger.info("COMPLETE!");
    })
    .catch((e) => {
      logger.error(e);
    });
}

module.exports = { saveMeasures };
