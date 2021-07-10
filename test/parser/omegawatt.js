var expect = require("chai").expect;
var { parseOmegawatt } = require("../../src/parser/omegawatt");
var fs = require("fs");

var empty = "./test/fixtures/parser/empty.csv";
var junk = "./test/fixtures/parser/junk.csv";
var fixture_bad_columns =
  "./test/fixtures/parser/omegawatt/fixture_bad_columns.tsv";
var fixture_bad_timestamp =
  "./test/fixtures/parser/omegawatt/fixture_bad_timestamp.tsv";
var fixture_bad_TX00 = "./test/fixtures/parser/omegawatt/fixture_bad_TX00.tsv";
var fixture1 = "./test/fixtures/parser/omegawatt/fixture1.tsv";
var fixture1_json = "./test/fixtures/parser/omegawatt/fixture1.json";

describe("Omegawatt parser", () => {
  it("handles an empty file", () => {
    return parseOmegawatt(empty)
      .then(() => {
        expect.fail("An empty file should cause the parser to throw!");
      })
      .catch((err) => {
        expect(err.message).to.equal("Could not find any data in the header!");
      });
  });

  it("handles non-tsv files", async () => {
    return parseOmegawatt(junk)
      .then(() => {
        expect.fail("A bad file");
      })
      .catch((err) => {
        expect(err.message).to.equal("Incorrect amount of columns");
      });
  });

  it("errors when there is the wrong amount of columns", async () => {
    return parseOmegawatt(fixture_bad_columns)
      .then(() => {
        expect.fail("A bad file");
      })
      .catch((err) => {
        expect(err.message).to.equal("Incorrect amount of columns");
      });
  });

  it.only("errors when there is the wrong format of timestamp", async () => {
    return parseOmegawatt(fixture_bad_timestamp)
      .then(() => {
        expect.fail("A bad file");
      })
      .catch((err) => {
        expect(err.message).to.equal("Incorrect amount of columns");
      });
  });

  it("errors when there is a bad TX00 format", async () => {
    const expected = [];

    const result = await parseOmegawatt(fixture_bad_TX00);

    expect(result).to.eql(expected);
  });

  it("handles correct tsv files", async () => {
    const expected = JSON.parse(fs.readFileSync(fixture1_json).toString());

    const result = await parseOmegawatt(fixture1);

    expect(result).to.eql(expected);
  });
});
