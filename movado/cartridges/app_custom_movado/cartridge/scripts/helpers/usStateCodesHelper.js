'use strict';

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
    return name;
}

// returns a valid state code else null
function getStateCodeByStateName(allowedStateNames, stateName) {
    var currentStateCodeName;
    var sanitizedStateName = sanitizeStateName(stateName) || null;
    var stateCode = ''
    if (!empty(allowedStateNames) && !empty(sanitizedStateName)) {
        for (var index = 0; index < allowedStateNames.length; index++) {
            currentStateCodeName = allowedStateNames[index].label.toString();
            if (!empty(currentStateCodeName) && !empty(sanitizedStateName) && currentStateCodeName == sanitizedStateName) {
                stateCode = allowedStateNames[index].id.toString();
                break;
            }
        }
    }
    return stateCode;
}

module.exports = {
  getStateCodeByStateName: getStateCodeByStateName,
  sanitizeStateName: sanitizeStateName
};
