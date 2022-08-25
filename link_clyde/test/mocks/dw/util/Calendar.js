'use strict';

var Calendar = function (date) {
    return {
        getTime: function () {
            return 0;
        },
        after: function () {
            return true;
        },
        add: function () {
            return this;
        },
        MONTH: 0,
		DATE: 0
    };
};

module.exports = Calendar;