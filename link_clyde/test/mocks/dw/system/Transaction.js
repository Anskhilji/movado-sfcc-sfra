'use strict';

module.exports = {
    wrap: function (cb) {
        return cb.call();
    }
};
