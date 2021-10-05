var expect = require("chai").expect;
var { parseDeviceTable } = require("../../src/parser/deviceTable");
var fs = require("fs");

var fixture1 = "./test/fixtures/parser/deviceTable/fixture1.csv";
var fixture1_json = "./test/fixtures/parser/deviceTable/fixture1.json";

describe("Device table parser", () => {
  it("handles correct csv files", async () => {
    const result = await parseDeviceTable(fixture1, ",");
    const expected = JSON.parse(fs.readFileSync(fixture1_json).toString());

    expect(result).to.eql(expected);
  });
});
