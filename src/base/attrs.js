function defineAttributeGetters(proto, properties) {
  for (var i = 0, len = properties.length; i < len; ++i) {
    var key = properties[i];
    (function(key) {
      proto['get' + key[0].toUpperCase() + key.substr(1)] = function() {
        return this['_' + key];
      };
    })(key);
  }
}

function defineAttributesCopy(classFunc, properties) {
  classFunc.prototype.copyAttributes = function() {
    var attrs = {};
    for (var i = 0, len = properties.length; i < len; ++i) {
      var key = properties[i];
      attrs[key] = this['_' + key];
    }
    return new classFunc(attrs);
  };
}

function defineAttributesSetter(proto, properties) {
  proto.setAttributes = function(attrs) {
    for (var i = 0, len = properties.length; i < len; ++i) {
      var key = properties[i];
      if (attrs.hasOwnProperty(key)) {
        this['_' + key] = attrs[key];
      }
    }
  };
}

function defineAttributeMethods(classFunc, properties) {
  defineAttributeGetters(classFunc.prototype, properties);
  defineAttributesCopy(classFunc, properties);
  defineAttributesSetter(classFunc.prototype, properties);
}

function setPrivateAttributeVariables(object, attrs, properties, defaults) {
  for (var i = 0, len = properties.length; i < len; ++i) {
    var key = properties[i];
    if (attrs.hasOwnProperty(key)) {
      object['_' + key] = attrs[key];
    } else {
      object['_' + key] = defaults[key];
    }
  }
}

exports.defineAttributeGetters = defineAttributeGetters;
exports.defineAttributesSetter = defineAttributesSetter;
exports.defineAttributesCopy = defineAttributesCopy;
exports.defineAttributeMethods = defineAttributeMethods;
exports.setPrivateAttributeVariables = setPrivateAttributeVariables;
