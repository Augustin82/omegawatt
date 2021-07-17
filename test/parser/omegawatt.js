var expect = require("chai").expect;
var { parseOmegawatt, timestampToDate } = require("../../src/parser/omegawatt");
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

describe("Omegawatt utils", () => {
  describe("timestamp validator", () => {
    it("can detect if a timestamp is valid or not", () => {
      const INVALID = null;
      const fixtures = [
        ["", INVALID],
        ["blabla", INVALID],
        ["12:33:42 2012-25-12", INVALID],
        ["2021/04/12", INVALID],
        ["2021/04/12 12h34", INVALID],
        ["03-07-21 22:30:00", INVALID],
        ["03/07/21 22 30 00", INVALID],
        ["33/07/21 22:30:00", INVALID],
        ["03/17/21 22:30:00", INVALID],
        ["03/07/21 22:30:00", new Date(2021, 6, 3, 22, 30, 0, 0).toISOString()],
      ];

      for (let i = 0; i < fixtures.length; i++) {
        const [timestamp, validity] = fixtures[i];
        const isValid = timestampToDate(timestamp);
        expect(
          isValid,
          `Timestamp '${timestamp}' should have validity ${validity} but has validity ${isValid}`
        ).to.eql(validity);
      }
    });
  });
});

describe("Omegawatt parser", () => {
  it("errors for empty files", () => {
    return parseOmegawatt(empty)
      .then(() => {
        expect.fail("An empty file should cause the parser to throw!");
      })
      .catch((err) => {
        expect(err.message).to.equal(
          "Could not find any data in the second header!"
        );
      });
  });

  it("errors for files that contain non-tsv text", async () => {
    return parseOmegawatt(junk)
      .then(() => {
        expect.fail("A bad file should cause the parser to throw!");
      })
      .catch((err) => {
        expect(err.message).to.equal(
          "Could not find any data in the second header!"
        );
      });
  });

  it("errors when there is the wrong amount of columns", async () => {
    return parseOmegawatt(fixture_bad_columns)
      .then(() => {
        expect.fail(
          "A bad number of columns should cause the parser to throw!"
        );
      })
      .catch((err) => {
        expect(err.message).to.equal("Incorrect amount of columns");
      });
  });

  it("errors when there is the wrong format of timestamp", async () => {
    return parseOmegawatt(fixture_bad_timestamp)
      .then(() => {
        expect.fail("A bad timestamp should cause the parser to throw!");
      })
      .catch((err) => {
        expect(err.message).to.equal("Incorrect timestamp format");
      });
  });

  it("errors when there is a bad TX00 format", async () => {
    return parseOmegawatt(fixture_bad_TX00)
      .then(() => {
        expect.fail("A bad TX00 format should cause the parser to throw!");
      })
      .catch((err) => {
        expect(err.message).to.equal("Incorrect filetype");
      });
  });

  it("handles correct tsv files", async () => {
    const expected = JSON.parse(fs.readFileSync(fixture1_json).toString());

    const result = await parseOmegawatt(fixture1);

    expect(result).to.eql(expected);
  });

  it("handles an actual production file", async () => {
    const prefix = "./test/fixtures/parser/omegawatt/";
    /** @type {[string, number][]} */
    const prodFiles = [
      ["T300_210713_103238.tsv", 255],
      ["T300_210713_152206.tsv", 510],
      ["T300_210713_154545.tsv", 51],
      ["T300_210714_020500.tsv", 3213],
      ["T300_210715_020500.tsv", 7344],
      ["T300_210716_020500.tsv", 7344],
    ];
    for (const [prodFile, length] of prodFiles) {
      const result = await parseOmegawatt(`${prefix}/${prodFile}`);

      expect(result).to.have.length(length);
    }
  });
});
