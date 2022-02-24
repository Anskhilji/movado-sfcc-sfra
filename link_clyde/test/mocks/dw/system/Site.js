'use strict';

module.exports = {
    getCurrent: function () {
        return {
            getCalendar: function () {
                return {
                    getTime: function () {
                        return 1568073600;
                    }
                };
            },
            getCustomPreferenceValue: function () {
                return true;
            }
        };
    }
};
