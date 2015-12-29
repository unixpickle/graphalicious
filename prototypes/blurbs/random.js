var randomSeed = 123;
var RANDOM_MODULUS = 151 * 239;

function seed(s) {
  randomSeed = s % RANDOM_MODULUS;
}

function random() {
  var number = 0;
  for (var i = 0; i < 7; ++i) {
    randomSeed = (randomSeed * randomSeed) % RANDOM_MODULUS;
    number |= ((randomSeed & 7) << (i * 3));
  }
  return number / ((1 << 21) - 1);
}
