function assert(condition, message) {
  if (!condition) {
    throw new Error('Assertion failure' + (message ? ': ' + message : ''));
  }
}

exports.assert = assert;
