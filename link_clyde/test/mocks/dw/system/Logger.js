'use strict';

var Logger = {
    debug: function (text) {
        return text;
    },
    error: function (text) {
        return text;
    },
    info: function (text) {
        return text;
    },
    warn: function (text) {
        return text;
    },
    getLogger: function () {
        return this;
    }
};

module.exports = Logger;
