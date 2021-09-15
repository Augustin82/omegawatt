const { client } = require("./init.js");
const { INFLUXDB_ORG } = process.env;

const createWriteApi = (bucket) =>
  client.getWriteApi(INFLUXDB_ORG || "", bucket);

module.exports = { createWriteApi };
