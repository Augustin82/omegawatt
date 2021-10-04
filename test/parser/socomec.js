let fs = require("fs");
var expect = require("chai").expect;
var { parseSocomec } = require("../../src/parser/socomec");

var empty = "./test/fixtures/parser/empty.csv";
var junk = "./test/fixtures/parser/junk.csv";
var fixture1 = "./test/fixtures/parser/socomec/fixture1.csv";
var fixture1_json = "./test/fixtures/parser/socomec/fixture1.json";

describe("Socomec parser", () => {
  it("handles an empty file", async () => {
    const expected = [];

    const result = await parseSocomec(empty);

    expect(result).to.eql(expected);
  });

  it("handles non-csv files", async () => {
    const expected = [];

    const result = await parseSocomec(junk);

    expect(result).to.eql(expected);
  });

  it("handles correct csv files", async () => {
    const result = await parseSocomec(fixture1);
    const expected = JSON.parse(fs.readFileSync(fixture1_json).toString());

    expect(result).to.eql(expected);
  });
});
