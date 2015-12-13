var fs = require('fs');
var assert = require('assert');

module.exports = function(files, symbols, scope) {
  var symbolStr = '[' + symbols.join(',') + ']';
  var codeBody = '(function() {';
  for (var i = 0, len = files.length; i < len; ++i) {
    codeBody += fs.readFileSync(__dirname + '/../src/' + files[i]);
  }
  codeBody += 'return ' + symbolStr + ';})();';

  var resArray;
  if ('undefined' === typeof scope) {
    resArray = eval(codeBody);
  } else {
    with (scope) {
      resArray = eval(codeBody);
    }
  }

  var resMap = {};
  assert.equal(resArray.length, symbols.length);
  for (var i = 0, len = resArray.length; i < len; ++i) {
    resMap[symbols[i]] = resArray[i];
  }
  return resMap;
};
