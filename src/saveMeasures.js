const { Point } = require("@influxdata/influxdb-client");
const { InfluxDB } = require("@influxdata/influxdb-client");
const { isInt, logger } = require("./lib");

async function saveMeasures(customer, projectName, measures) {
  const { INFLUXDB_ADMIN_TOKEN, INFLUXDB_URL, INFLUXDB_ORG } = process.env;

  const { bucket } = customer;

  const client = new InfluxDB({
    url: INFLUXDB_URL,
    token: INFLUXDB_ADMIN_TOKEN,
  });

  const writeApi = client.getWriteApi(INFLUXDB_ORG, bucket);

  let points = [];
  for (let measure of measures) {
    const value = measure["value"];
    if (isInt(value)) {
      const point = new Point(measure["measured_value"])
        .timestamp(new Date(measure.measured_at))
        //SN
        .tag("device_name", measure["device_name"])
        .tag("usage", measure["usage"])
        .tag("nature", measure["nature"])
        //see https://github.com/Augustin82/omegawatt/issues/2
        .tag("measured_value", measure["measured_value"])
        .tag("unit", measure["unit"])
        .tag("project", projectName)
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
