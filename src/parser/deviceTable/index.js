const fs = require("fs");
const parse = require("csv-parse/lib/sync");

const { guessDelimiter } = require("../../lib");

/** @type {(filepath: string, delimiter?: string) => Promise<Record<any, any>>} */
const parseDeviceTable = async (filepath, delimiter = "\t") => {
  try {
    delimiter = delimiter || guessDelimiter(filepath);

    const fileContent = fs.readFileSync(filepath, {
      encoding: "utf8",
      flag: "r",
    });

    const csvOptions = {
      delimiter,
      columns: false,
      skip_empty_lines: true,
    };

    let deviceTable = {};
    const rows = parse(fileContent, csvOptions);

    for (const row of rows) {
      // SN, Channel, Début, Device Name, Coeff, Usage
      const { serial_number, channel, start, device_name, coeff, usage } = row;
      if (!deviceTable[serial_number]) {
        deviceTable[serial_number] = {};
      }
      if (!deviceTable[serial_number][channel]) {
        deviceTable[serial_number][channel] = {};
      }
      const isoDate = start || new Date(0).toISOString();
      deviceTable[serial_number][channel][isoDate] = {
        device_name,
        coeff,
        usage,
      };
    }

    return deviceTable;
  } catch (_e) {
    return {};
  }
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
    if (deviceTable[serialNumber][channel]) {
      const periods = deviceTable[serialNumber][channel];
      const starts = Object.keys(periods).sort(function (a, b) {
        return new Date(b).getTime() - new Date(a).getTime();
      });
      for (let start of starts) {
        if (new Date(timestamp).getTime() > new Date(start || 0).getTime()) {
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
    device_name: `${serialNumber}_${channel}`,
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
  getDeviceTable,
};
