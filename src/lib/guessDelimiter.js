const guessDelimiter = (filepath) => {
  const extension = filepath.split(".").slice(-1)[0];
  if(extension == "tsv"){
    return "\t";
  } else if(extension == "csv"){
    return ",";
  }
  return ",";
};

module.exports = {
  guessDelimiter,
};
