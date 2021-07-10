const guessDelimiter = (filepath) => {
  const extension = filepath.split(".").slice(-1);
  switch (extension) {
    case "tsv":
      return "\t";
    case "csv":
    default:
      return ",";
  }
};

module.exports = {
  guessDelimiter,
};
