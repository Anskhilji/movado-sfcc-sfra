'use strict';

var Site = require('dw/system/Site');

var usStateCodes = Site.current.preferences.custom.usStatesList;
var stateNamesByCode = JSON.parse(usStateCodes);
var stateCodesByName = getReversedJSON(stateNamesByCode);

// normalizes case and removes invalid characters
// returns null if can't find sanitized code in the state map
var sanitizeStateCode = function(code) {
    if (!code || typeof code !== 'string') {
        return null;
    }

    code = code.trim().toUpperCase().replace(/[^A-Z]/g, '');
    return stateNamesByCode[code] ? code : null;
}

// normalizes case and removes invalid characters
// returns null if can't find sanitized name in the state map
function sanitizeStateName(name) {
    if (!name || typeof name !== 'string') {
        return null;
    }

// Bad whitespace remains bad whitespace, e.g., "O  hi o" is not valid
    name = name.trim().toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ');

    var tokens = name.split(/\s+/);
    tokens = tokens.map(function (token) {
      return token.charAt(0).toUpperCase() + token.slice(1);
    });

    // Account for "District of Columbia"
    if (tokens.length > 2) {
      tokens[1] = tokens[1].toLowerCase();
    }

    name = tokens.join(' ');
    return stateCodesByName[name] ? name : null;
}


// returns a valid state name else null
function getStateNameByStateCode(code) {
    return stateNamesByCode[sanitizeStateCode(code)] || null;
}

// returns a valid state code else null
function getStateCodeByStateName(name) {
    return stateCodesByName[sanitizeStateName(name)] || null;
}

function getReversedJSON(originalJSON) {
    var reversedJSON = {};

    Object.keys(originalJSON).forEach(function (key) {
        if (originalJSON.hasOwnProperty(key)) {
            reversedJSON[originalJSON[key]] = key;
        }
    });

    return reversedJSON;
}

module.exports = {
  getStateNameByStateCode: getStateNameByStateCode,
  getStateCodeByStateName: getStateCodeByStateName,
  sanitizeStateName: sanitizeStateName,
  sanitizeStateCode: sanitizeStateCode
};
