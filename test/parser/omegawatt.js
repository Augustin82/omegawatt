const chai = require("chai");
// chai.config.truncateThreshold = 0;
let expect = chai.expect;
const { DateTime } = require("luxon");
let { parseOmegawatt } = require("../../src/parser/omegawatt");
let { getDeviceInfo } = require("../../src/parser/deviceTable");
let fs = require("fs");
const { parseOmegawattTime } = require("../../src/lib/dateHelpers");

let empty = "./test/fixtures/parser/empty.csv";
let junk = "./test/fixtures/parser/junk.csv";
let fixture_bad_columns =
  "./test/fixtures/parser/omegawatt/fixture_bad_columns.tsv";
let fixture_bad_timestamp =
  "./test/fixtures/parser/omegawatt/fixture_bad_timestamp.tsv";
let fixture_bad_TX00 = "./test/fixtures/parser/omegawatt/fixture_bad_TX00.tsv";
let fixture1 = "./test/fixtures/parser/omegawatt/fixture1.tsv";
let fixture1_json = "./test/fixtures/parser/omegawatt/fixture1.json";
let fixture_full = "./test/fixtures/parser/omegawatt/fixture_full.tsv";
let fixture_full_json = "./test/fixtures/parser/omegawatt/fixture_full.json";
let deviceTable_json = "./test/fixtures/parser/omegawatt/deviceTable.json";

let emptyDeviceTable = getDeviceInfo({});
let fullDeviceTable = getDeviceInfo(
  JSON.parse(fs.readFileSync(deviceTable_json).toString())
);

describe("Omegawatt utils", () => {
  describe("timestamp validator", () => {
    it("can detect if a timestamp is valid or not", () => {
      const INVALID = null;
      const validDate = DateTime.fromISO("2021-07-03T22:30:00", {
        zone: "Europe/Paris",
      });
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
        ["03/07/21 22:30:00", validDate.toUTC().toISO()],
      ];

      for (let i = 0; i < fixtures.length; i++) {
        const [timestamp, validity] = fixtures[i];
        const isValid = parseOmegawattTime(timestamp);
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
    return parseOmegawatt(empty, emptyDeviceTable)
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
    return parseOmegawatt(junk, emptyDeviceTable)
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
    return parseOmegawatt(fixture_bad_columns, emptyDeviceTable)
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
    return parseOmegawatt(fixture_bad_timestamp, emptyDeviceTable)
      .then(() => {
        expect.fail("A bad timestamp should cause the parser to throw!");
      })
      .catch((err) => {
        expect(err.message).to.equal("Incorrect timestamp format");
      });
  });

  it("errors when there is a bad TX00 format", async () => {
    return parseOmegawatt(fixture_bad_TX00, emptyDeviceTable)
      .then(() => {
        expect.fail("A bad TX00 format should cause the parser to throw!");
      })
      .catch((err) => {
        expect(err.message).to.equal("Incorrect filetype");
      });
  });

  it("handles correct tsv files", async () => {
    const result = await parseOmegawatt(fixture1, emptyDeviceTable);
    const expected = JSON.parse(fs.readFileSync(fixture1_json).toString());

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
      const result = await parseOmegawatt(
        `${prefix}/${prodFile}`,
        emptyDeviceTable
      );

      expect(result).to.have.length(length);
    }
  });

  it("handles a correct tsv file with a device table", async () => {
    const result = await parseOmegawatt(fixture_full, fullDeviceTable);
    const expected = JSON.parse(fs.readFileSync(fixture_full_json).toString());

    expect(result).to.eql(expected);
  });
});
