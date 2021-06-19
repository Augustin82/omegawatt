const { DEVICE_NAME } = require("./constant");

// "Device name","IP Address","Modbus Address","Begin date","End date"
// "ASP. HERDING",0.0.0.0,11,2000-01-01T00:00:00,2020-05-27T11:00:00,
const parseMainHeading = async (row, metadatas) => {
  metadatas[DEVICE_NAME] = row[0];
};

module.exports = { parseMainHeading };
