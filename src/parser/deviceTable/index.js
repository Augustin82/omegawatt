const { DateTime } = require("luxon");
const fs = require("fs");
const parse = require("csv-parse/lib/sync");

const { guessDelimiter } = require("../../lib");

/** @type {(filepath: string, delimiter?: string) => Promise<Record<any, any>>} */
const parseDeviceTable = async (filepath, delimiter = "\t") => {
  let deviceTable = {};
  try {
    delimiter = delimiter || guessDelimiter(filepath);

    if (fs.existsSync(filepath)) {
      const fileContent = fs.readFileSync(filepath, {
        encoding: "utf8",
        flag: "r",
      });

      const csvOptions = {
        delimiter,
        columns: true,
        skip_empty_lines: true,
      };

      const rows = parse(fileContent, csvOptions);

      for (const row of rows) {
        // SN, Channel, Device Name, Début, Coeff, Usage
        const { sn, channel, device_name, start_date, coeff, usage } = row;
        const chan = `${channel}`.toLowerCase();
        if (!deviceTable[sn]) {
          deviceTable[sn] = {};
        }
        if (!deviceTable[sn][chan]) {
          deviceTable[sn][chan] = {};
        }
        const isoDate = DateTime.fromFormat(start_date, "dd/MM/yy HH:mm:ss", {
          zone: "Europe/Paris",
        })
          .toUTC()
          .toISO();
        deviceTable[sn][chan][isoDate] = {
          device_name,
          coeff,
          usage,
        };
      }
    }
  } catch (error) {
    console.log({ error });
  }
  return deviceTable;
};

/** @typedef {Record<string, Record<string, Record<string, DeviceInfo>>>} DeviceTable **/
/** @typedef {{ device_name: string, coeff: number, usage: string }} DeviceInfo **/

/**
 * @param {DeviceTable} deviceTable
 * @returns {(serialNumber: string, channel: string, timestamp: string) => DeviceInfo}
 *
 **/
const getDeviceInfo = (deviceTable) => (serialNumber, channel, timestamp) => {
  if (deviceTable[serialNumber]) {
    if (deviceTable[serialNumber][`${channel}`.toLowerCase()]) {
      const periods = deviceTable[serialNumber][`${channel}`.toLowerCase()];
      const starts = Object.keys(periods).sort(function (a, b) {
        return new Date(b).getTime() - new Date(a).getTime();
      });
      for (let start of starts) {
        if (new Date(timestamp).getTime() >= new Date(start || 0).getTime()) {
          const period = periods[start];
          return {
            device_name: period.device_name,
            coeff: period.coeff,
            usage: period.usage,
          };
        }
      }
    }
  }
  return {
    device_name: [serialNumber, channel].filter(Boolean).join("_"),
    coeff: 1,
    usage: "",
  };
};

/** @returns {Promise<(serialNumber: string, channel: string, timestamp: string) => DeviceInfo>} **/
const getDeviceTable = async (filepath, delimiter) => {
  const deviceTable = await parseDeviceTable(filepath, delimiter);
  return getDeviceInfo(deviceTable);
};

module.exports = {
  parseDeviceTable,
  getDeviceInfo,
  getDeviceTable,
};
