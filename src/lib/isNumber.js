function isInt(value) {
  try {
    const n = parseInt(value);
    return Number(n) === n && n % 1 === 0;
  } catch (err) {
    return false;
  }
}

function isFloat(n) {
  return Number(n) === n && n % 1 !== 0;
}

module.exports = { isInt, isFloat };
