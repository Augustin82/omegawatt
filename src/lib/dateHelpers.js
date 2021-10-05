const { DateTime } = require("luxon");

const parseOmegawattTime = (timestamp) => {
  // timestamp format for omegawatt:
  // DD/MM/YY HH:mm:ss
  // luxon equivalent:
  // dd/MM/yy HH:mm:ss

  if (!timestamp) {
    return null;
  }

  return DateTime.fromFormat(timestamp, "dd/MM/yy HH:mm:ss", {
    zone: "Europe/Paris",
    setZone: true,
    keepLocalTime: true,
  })
    .toUTC()
    .toISO();
};

const parseSocomecTime = (timestamp) =>
  DateTime.fromISO(timestamp, {
    setZone: true,
    zone: "Europe/Paris",
    keepLocalTime: true,
  }).toISO();

module.exports = {
  parseSocomecTime,
  parseOmegawattTime,
};
