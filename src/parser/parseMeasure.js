const { MEASURE_STATES } = require("../models");
const { DEVICE_NAME, METADATA_KEY } = require("./constant");

const { LOAD_NAME, USAGE, NATURE, MEASURED_VALUE, UNIT, SCALE } = METADATA_KEY;

// 2020-05-27T11:00:00,186706,0,26,
const parseMeasure = async (row, metadatas) => {
  const { measureMetadatas } = metadatas;
  const measureDateAsString = row[0];
  if (measureDateAsString.length === 0) {
    return;
  }
  const measure = {
    device_name: metadatas[DEVICE_NAME],
    measured_at: measureDateAsString,
    state: MEASURE_STATES.PRESENT,
  };

  for (let i = 0; i < measureMetadatas.length; i++) {
    //TODO: should create as many measures as values
    const measureMetadata = measureMetadatas[i];
    const measureIndex = i + 1;
    measure["load_name" + measureIndex] = measureMetadata[LOAD_NAME];
    measure["usage" + measureIndex] = measureMetadata[USAGE];
    measure["nature" + measureIndex] = measureMetadata[NATURE];
    measure["measured_value" + measureIndex] = measureMetadata[MEASURED_VALUE];
    measure["unit" + measureIndex] = measureMetadata[UNIT];
    measure["scale" + measureIndex] = measureMetadata[SCALE];
    measure["value" + measureIndex] = row[measureIndex];
  }
  return measure;
};

module.exports = { parseMeasure };
