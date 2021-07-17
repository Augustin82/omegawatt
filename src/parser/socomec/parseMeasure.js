const { MEASURE_STATES } = require("../../models");
const { DEVICE_NAME, METADATA_KEY } = require("../constant");

const { LOAD_NAME, USAGE, NATURE, MEASURED_VALUE, UNIT, SCALE } = METADATA_KEY;

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
      device_name: metadatas[DEVICE_NAME],
      measured_at: measureDateAsString,
      state: MEASURE_STATES.PRESENT,
      load_name: measureMetadata[LOAD_NAME],
      usage: measureMetadata[USAGE],
      nature: measureMetadata[NATURE],
      measured_value: measureMetadata[MEASURED_VALUE],
      unit: measureMetadata[UNIT],
      scale: measureMetadata[SCALE],
      value: row[measureIndex],
    };

    return measure;
  });

  return measures;
};

module.exports = { parseMeasure };
