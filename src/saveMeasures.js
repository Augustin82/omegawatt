const { Point } = require("@influxdata/influxdb-client");
const { InfluxDB } = require("@influxdata/influxdb-client");
const { isInt, logger } = require("./lib");

async function saveMeasures(measures) {
  const { INFLUXDB_ADMIN_TOKEN, INFLUXDB_ORG, INFLUXDB_BUCKET, INFLUXDB_URL } =
    process.env;

  const client = new InfluxDB({
    url: INFLUXDB_URL,
    token: INFLUXDB_ADMIN_TOKEN,
  });

  //TODO(tglatt): influxdb org should be the ftp dirname
  const writeApi = client.getWriteApi(INFLUXDB_ORG, INFLUXDB_BUCKET);

  let points = [];
  for (let measure of measures) {
    for (let index = 1; index <= 6; index++) {
      const value = measure["value" + index];
      if (isInt(value)) {
        const point = new Point("socomec")
          .timestamp(new Date(measure.measured_at))
          .tag("device_name", measure["device_name"])
          .tag("usage", measure["usage" + index])
          .tag("nature", measure["nature" + index])
          .tag("measured_value", measure["measured_value" + index])
          .tag("unit", measure["unit" + index])
          .floatField("value", value);
        points.push(point);
      }
      if (points.length > 1000) {
        writeApi.writePoints(points);
        await writeApi.flush();
        points = [];
      }
    }
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
