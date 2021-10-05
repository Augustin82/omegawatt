const { parseSocomecTime } = require("../../lib/dateHelpers");
const { DEVICE_NAME, METADATA_KEY } = require("../constant");

const { LOAD_NAME, USAGE, NATURE, UNIT, MEASURED_VALUE } = METADATA_KEY;

// 2020-05-27T11:00:00,186706,0,26,

/** @typedef {{ measureMetadatas: any[] }} Metadata */

/**
 * @type {(row: any, metadatas: Metadata) => Promise<Record<any, any>[]> }
 */
const parseMeasure = async (row, metadatas) => {
  const { measureMetadatas } = metadatas;
  const measureDateAsString = row[0];
  if (measureDateAsString.length === 0) {
    return [];
  }

  const measures = measureMetadatas.map((measureMetadata, index) => {
    const measureIndex = index + 1;
    const measure = {
      measured_at: parseSocomecTime(measureDateAsString),
      sn: measureMetadata[LOAD_NAME],
      channel: measureMetadata[NATURE],
      device_name: metadatas[DEVICE_NAME],
      usage: measureMetadata[USAGE],
      measured_value: measureMetadata[MEASURED_VALUE],
      unit: measureMetadata[UNIT],
      value: row[measureIndex],
    };

    return measure;
  });

  return measures;
};

module.exports = { parseMeasure };
