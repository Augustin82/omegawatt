const { InfluxDB } = require("@influxdata/influxdb-client");
const dotenv = require("dotenv");
dotenv.config();
const { INFLUXDB_ADMIN_TOKEN, INFLUXDB_URL } = process.env;

const client = new InfluxDB({
  url: INFLUXDB_URL || "",
  token: INFLUXDB_ADMIN_TOKEN,
});

module.exports = { client };
