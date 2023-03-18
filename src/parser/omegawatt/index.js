const fs = require("fs");
const parse = require("csv-parse/lib/sync");
const { parseOmegawattTime } = require("../../lib/dateHelpers.js");
const { parseLoraTime } = require("../../lib/dateHelpers.js");
const { logger, guessDelimiter } = require("../../lib");

// Type Module (1 : TempPulses, 2 : TempHygro, 3 : Lamp, 4: TempPulseDébit 15: CO2)
const Units = [ ["C","C"," "," "],["C","%"," "," "], [" "," ","s"], ["C","C"," "," "], ["ppm"," "," "]];
const MeasuredValues = [ ["T1","T2","P1", "P2"], ["T1","RH","P1", "P2"], ["L","S", "ON"], ["T1","T2","P1", "P2"], ["CO2","P1", "P2"]];
const UnitsWM = [ "Wh", "V", "A", "VAh", "W", "VA", "C" ];
const MeasuredValuesWM = ["EA", "V", "I", "ES", "P", "S", "T"];

const voltageOffset = 4;		// En triphasé
let has_reactive_power = true;

const isAmountOfColumnsValid = (row) => {
  const length = row.length;
  if (length < voltageOffset + measuresOffset) {
    return false;
  }
  if ((length - voltageOffset - measuresOffset) % 12 !== 0) {
    return false;
  }
  return true;
};

const firstRowToMetadata = (fileContent, delimiter) => {
  const csvOptions = {
    delimiter,
    columns: false,
    to_line: 1,
    skip_empty_lines: true,
  };

  const rows = parse(fileContent, csvOptions);
  if (!rows || !rows.length) {
    throw Error("Could not find any data in the header!");
  }
  const row = rows[0];
  if (!row || !row.length) {
    throw Error("Could not find any data in the header!");
  }

 /* if (!isAmountOfColumnsValid(row)) {
    throw Error("Incorrect amount of columns");
  }
*/
  let offset = 0;
  const devices = [row[offset]];		// liste les SN ou Volts
  offset += 1;
  while (row[offset]) {
    devices.push(row[offset]);
    offset += 1;
  }
  return devices;
};

const getFileType = (row) => {
  const fileTypeString = row[0];
  if (!fileTypeString) {
    return null;
  }

 const regexp2 = /^LORA_V...$/;				// Check if Lora File format
 const match2 = fileTypeString.match(regexp2);
 if (match2) {
		//is_lora_data = true;				// File has Lora File format
		return 999;
	}

 const regexp1 = /^MV_T..(\d)_V...$/;		// Get last character of Type
 const match1 = fileTypeString.match(regexp1);
 if (match1 && match1[1].includes("2")) {
		has_reactive_power = false;		// File has_reactive_power
	}

  const regexp = /^MV_T(\d\d\d)_V...$/;
  const match = fileTypeString.match(regexp);
  return match && (match[1] || null);

};

const secondRowToFileType = (fileContent, delimiter) => {
  const csvOptions = {
    delimiter,
    columns: false,
    from_line: 2,
    to_line: 2,
    skip_empty_lines: true,
  };

  const rows = parse(fileContent, csvOptions);
  if (!rows || !rows.length) {
    throw Error("Could not find any data in the second header!");
  }
  const row = rows[0];
  if (!row || !row.length) {
    throw Error("Could not find any data in the second header!");
  }

  const fileType = getFileType(row);
  if (!fileType) {
    throw Error("Incorrect filetype");
  }
  return fileType;
};

/** Lora Types decoding **/
const getLoraInfoUnit = (type1, type2, chan) => {
	switch (type1) {
	  case 1: case 2: case 3: case 4: 
      	return Units[type1-1][chan-1];
				break;
	  case 15:   return Units[4][chan-1];
				break;
	  case 20:  case 21: case 24: 
             let c=1;		// retrieve channel using type2 mask and chan order             
					let d=0;                    
					while ((chan>1) && (d<8))  {                           
						d+=1;
						if (type2 & c)	{
							chan-=1;
						 }
						c<<=1;                       
                      }
				return UnitsWM[d];
				break;
		default: return "X";
	};
};  

const getLoraInfoMeasured = (type1, type2, chan) => {
	switch (type1) {
	  case 1: case 2: case 3: case 4: 
      	return MeasuredValues[type1-1][chan-1];
				break;
	  case 15:   return MeasuredValues[4][chan-1];
				break;
	  case 20:  case 21: case 24: 
             let c=1;		// retrieve channel using type2 mask and chan order             
					let d=0;                    
					while ((chan>1) && (d<8))  {                           
						d+=1;
						if (type2 & c)	{
							chan-=1;
						 }
						c<<=1;                       
                      }
				return MeasuredValuesWM[d];
				break;
		default: return "X";
	};
}; 

/** @param {DeviceTable} deviceTable **/
const rowToMeasures = (metadata, deviceTable, fileType1) => (row) => {
  const measures = [];
  const measured_at = ((fileType1 == 999)?parseLoraTime(row[0]): parseOmegawattTime(row[0]));
  if (!measured_at) {
    throw Error("Incorrect timestamp format" + row[0]);
  }
  let channel,
    unit,
    measured_value,
    chan = "";
  let offset = 1;
  let columnForDevice=1;
  let last_SN=0;
  let voieNumber;
  let sn = "0";
  let type1 = 0;	// LORA Sensor Type1	
  let type2 = 0;	// LORA Sensor Type2: detail WM

  while (row[offset]) {
	if (fileType1 == 999)	{  // Lora File Format #####################
		switch (offset) {
		  case 1:
			sn = row[offset];
			break;
		  case 2:
			type1 = Number(row[offset]);
			break;
		  case 3:
			type2 = Number(row[offset]);
			break;
		  case 4:
			channel = "RSSI1";		
			chan = 10;
			unit = "dB"; 
			measured_value =  "RSSI1";
			break;
		  case 5:
			channel = "RSSI2";		
			chan = 11;
			unit = "dB"; 
			measured_value =  "RSSI2";
			break;
		  case 6:
			channel = "BAT";		
			chan = 12;
			unit = "V"; 
			measured_value =  "BAT";
			break;
		  default:		// convert to db format
			chan = offset-6;
			channel = `Voie${chan}`;		
			unit = getLoraInfoUnit(type1, type2, chan); 
			measured_value =  getLoraInfoMeasured(type1, type2, chan);
		}
		chan = `${chan || ""}`.toLowerCase();
	}
	else		{	// MV2 File Format
		sn = metadata[offset];	// Checl all columns
		if (sn.includes("Volts")) {
		  channel = `Ph${offset}`;
		  chan = channel.toLowerCase();
		  [measured_value, unit] = ["V", "V"];
		  sn = metadata[0];
		} else {
		  if (last_SN!=sn)  {
			columnForDevice = 1;
			last_SN=sn;
			}
		  if (fileType1.slice(-1)!="2")	{		// has_reactive_power)  {
			voieNumber = ~~((columnForDevice - 1) / 2) + 1;
		  [measured_value, unit] =
			columnForDevice % 2 === 0 ? ["Q", "Var"] : ["P", "W"];
			}
		  else  {
			voieNumber = columnForDevice;
		   [measured_value, unit] = ["P", "W"];
			}
		  channel = `Voie${voieNumber}`;
		  chan = `${voieNumber || ""}`.toLowerCase();
		  columnForDevice +=1;
		}
	}
   // const device_offset = ~~((offset - voltageOffset) / 12);
	if ((fileType1 != 999) || (offset>=4))	{ 		// skip first rows for LORA files
		const { device_name, coef, usage } = deviceTable(sn, chan, measured_at);
		const value = `${row[offset] * coef}`;
		const measure = {
		  measured_at,
		  sn,
		  channel,
		  device_name,
		  usage,
		  measured_value,
		  unit,
		  value,
		};
		measures.push(measure);
	}
	offset += 1;
  }

  return measures;
};

/** @param {DeviceTable} deviceTable **/
const otherRowsToMeasures = (fileContent, delimiter, deviceTable, metadata, fileType1) => {
  const toMeasures = rowToMeasures(metadata, deviceTable, fileType1);
  const csvOptions = {
    delimiter,
    columns: false,
    from_line: 3,
    skip_empty_lines: true,
	relax_column_count: (fileType1==999), //!!is_lora_data,				/// nécessaire pour Lora: nbre columns variable
  };
//logger.info("OtherRows isLoraData "+is_lora_data+" delimiter:"+csvOptions.delimiter+" \n");
  const rows = parse(fileContent, csvOptions);

  const measures = rows.reduce((acc, row) => [...acc, ...toMeasures(row)], []);

  return measures;
};

/** @typedef {{ device_name: string, coef: number, usage: string }} DeviceInfo **/
/** @typedef {(serialNumber: string, channel: string, timestamp: string) => DeviceInfo } DeviceTable **/

/** @type {(filepath: string, deviceTable: DeviceTable, delimiter?: string) => Promise<Record<any, any>[]>} */
const parseOmegawatt = async (filepath, deviceTable, delimiter = '\t') => {		//  default delimiter = "\t"
  delimiter = ['\t',';'];  		  //  delimiter || guessDelimiter(filepath);

  const fileContent = fs.readFileSync(filepath, {
    encoding: "utf8",
    flag: "r",
  });

  const fileType1 = secondRowToFileType(fileContent, delimiter);

  const metadata = firstRowToMetadata(fileContent, delimiter);

  const measures = otherRowsToMeasures(
    fileContent,
    delimiter,
    deviceTable,
    metadata,
	fileType1
  );

  return measures;
};

module.exports = {
  parseOmegawatt,
};
