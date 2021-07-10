var expect = require("chai").expect;
var { parseOmegawatt } = require("../../src/parser/omegawatt");
var fs = require("fs");

var empty = "./test/fixtures/parser/empty.csv";
var junk = "./test/fixtures/parser/junk.csv";
var fixture1 = "./test/fixtures/parser/omegawatt/fixture1.tsv";
var fixture1_json = "./test/fixtures/parser/omegawatt/fixture1.json";

describe("Omegawatt parser", () => {
  it("handles an empty file", async () => {
    const expected = [];

    const result = await parseOmegawatt(empty);

    expect(result).to.eql(expected);
  });

  it("handles non-tsv files", async () => {
    const expected = [];

    const result = await parseOmegawatt(junk);

    expect(result).to.eql(expected);
  });

  it("handles correct tsv files", async () => {
    const expected = JSON.parse(fs.readFileSync(fixture1_json).toString());

    const result = await parseOmegawatt(fixture1);

    expect(result).to.eql(expected);
  });
});
