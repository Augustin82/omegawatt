const parseMeasuresMetadata = async (row, metadatas) => {
  // INPUT
  // ==================================
  // "Usage","Heating","Heating","Heating",
  // "Nature","Elec","Elec","Elec",
  // "Measured value","EA+","EA-","ER+",
  // "Unit","Wh","Wh","varh",
  // "Scale",0.0010000,0.0010000,0.0010000,

  const key = row[0];
  for (let i = 0; i < row.length - 1; i++) {
    const value = row[i];
    if (value) {
      const { measureMetadatas } = metadatas;
      const measureMetadataIndex = i - 1;
      let measureMetadata = measureMetadatas[measureMetadataIndex];
      if (!measureMetadata) {
        measureMetadata = {};
        measureMetadatas[measureMetadataIndex] = measureMetadata;
      }
      measureMetadata[key] = value;
    }
  }
  // OUTPUT
  // ==================================
  // {
  //   "Device name": "ASP. HERDING",
  //   "measureMetadatas": [
  //     {
  //       "Load Name": "ASP HERDING",
  //       "Usage": "Heating",
  //       "Nature": "Elec",
  //       "Measured value": "EA+",
  //       "Unit": "Wh",
  //       "Scale": "0.0010000"
  //     },
  //     {
  //       "Load Name": "ASP HERDING",
  //       "Usage": "Heating",
  //       "Nature": "Elec",
  //       "Measured value": "EA-",
  //       "Unit": "Wh",
  //       "Scale": "0.0010000"
  //     },
  //     {
  //       "Load Name": "ASP HERDING",
  //       "Usage": "Heating",
  //       "Nature": "Elec",
  //       "Measured value": "ER+",
  //       "Unit": "varh",
  //       "Scale": "0.0010000"
  //     }
  //   ]
  // }
};

module.exports = { parseMeasuresMetadata };
