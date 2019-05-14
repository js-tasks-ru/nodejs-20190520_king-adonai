function sum(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') throw new TypeError('function sum() should take only numbers');

  return a + b;
}

module.exports = sum;
