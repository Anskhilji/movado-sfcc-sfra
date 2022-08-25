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
    },
    current: {
        preferences: {
            custom: {
               clydeSendNewProductLastSyncTime: '2021081T20201',
               clydeSendFullProductLastSyncTime: '2021081T20201',
               clydeSendDeltaProductLastSyncTime: '2021081T20201',
               clydeCancelOrderLastSyncTime: '2021081T20201',
               clydeSendOrderLastSyncTime: '2021081T20201' 
            }
        }
    }
};
