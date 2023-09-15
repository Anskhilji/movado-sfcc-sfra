"use strict";

var assert = require("chai").assert;
var proxyquire = require("proxyquire").noCallThru().noPreserveCache();

var Status = require("../../../../../mocks/Status");

var callService = proxyquire(
    "../../../../../../social_channels/cartridges/int_tiktok_pixel/cartridge/scripts/jobs/TikTokEvent.js",
    {
        "dw/system/Status": Status,

        "dw/system/Transaction": {
            wrap: function (arg) {
                arg();
            },
        },

        "dw/object/CustomObjectMgr": {
            getCustomObject: function () {
                return ;
            },
            queryCustomObjects: function(type, queryString, sortString, args) {
                return {
                    getCount: function () {
                        return 10;
                    },
                    asList: function() {
                        return [
                            {
                                custom : {
                                    EventList : JSON.stringify([{"type":"track","event":"ViewContent","event_id":"bcoO9Gz2utfda5OQxohxfMmloP","timestamp":"2023-09-06T14:13:03Z","context":{"ad":{"callback":""},"page":{"url":"https://xxx.com/on/demandware.store/Sites-RefArch-Site/en_US/Product-Show?pid=701644329402M&lang=en_US","referrer":"https://xxx.com/s/RefArch/home?lang=en_US"},"user":{"external_id":"","phone_number":"","email":""},"user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"},"properties":"{\"contents\":[{\"content_type\":\"product\",\"content_id\":\"701644329402M\",\"quantity\":1,\"price\":49}],\"currency\":\"USD\"}"},{"type":"track","event":"ViewContent","event_id":"bcoO9Gz2utfda5OQxohxfMmloP","timestamp":"2023-09-06T14:13:04Z","context":{"ad":{"callback":""},"page":{"url":"https://xxx.com/on/demandware.store/Sites-RefArch-Site/en_US/Product-Show?pid=701644391737M&lang=en_US","referrer":"https://xxx.com/s/RefArch/home?lang=en_US"},"user":{"external_id":"","phone_number":"","email":""},"user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"},"properties":"{\"contents\":[{\"content_type\":\"product\",\"content_id\":\"701644391737M\",\"quantity\":1,\"price\":89}],\"currency\":\"USD\"}"},{"type":"track","event":"ViewContent","event_id":"bcoO9Gz2utfda5OQxohxfMmloP","timestamp":"2023-09-06T14:13:05Z","context":{"ad":{"callback":""},"page":{"url":"https://xxx.com/on/demandware.store/Sites-RefArch-Site/en_US/Product-Show?pid=25519318M&lang=en_US","referrer":"https://xxx.com/s/RefArch/home?lang=en_US"},"user":{"external_id":"","phone_number":"","email":""},"user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"},"properties":"{\"contents\":[{\"content_type\":\"product\",\"content_id\":\"25519318M\",\"quantity\":1,\"price\":24}],\"currency\":\"USD\"}"}]),
                                    EventTimestamp: "2023-08-31T18:08:06Z0"
                                }
                            }
                        ]
                    },
                    close: function () {
                        return true;
                    }
                }
            }, 
            remove: function () {
                return;
            }
        },

        "dw/system/Logger": {
            info: function (text) {
                return text;
            },
            error: function (text) {
                return text;
            },
            getLogger: function () {
                return {
                    error: function (text) {
                        return text;
                    },
                    info: function (text) {
                        return text;
                    },
                };
            },
        },

        "int_tiktok/cartridge/scripts/services/tiktokService": {
            batchPixelTrack:function() {
                return true;
            }
        },

        "int_tiktok/cartridge/scripts/customObjectHelper": {
            getCustomObject: function () {
                return;
            },
            createNewTikTokWebEventsBundle: function () {
                return;
            },
            timestamp: function () {
                return "2023-08-31T18:08:06Z";
            },
            getTreatedEvent: function () {
                return {
                    type: "track",
                    event: "ViewContent",
                    event_id: "bcoO9Gz2utfda5OQxohxfMmloP",
                    timestamp: "2023-09-06T13:57:25Z",
                    context: {
                      ad: {
                        callback: ""
                      },
                      page: {
                        url: "https://xxx.com/on/demandware.store/Sites-RefArch-Site/en_US/Product-Show?pid=701644329402M&lang=en_US",
                        referrer: "https://xxx.com/s/RefArch/home?lang=en_US"
                      },
                      user: {
                        external_id: "",
                        phone_number: "",
                        email: ""
                      },
                      user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
                    },
                    properties: '{\"contents\":[{\"content_type\":\"product\",\"content_id\":\"701644329402M\",\"quantity\":1,\"price\":49}],\"currency\":\"USD\"}'
                  }
            },
            getTikTokEventsByGroupSize() {
                return []
            }
        }
    }
);

describe('Tiktok Event Jobs - Grouping CO events and sending them to TikTok', function () {
    it('groupTikTokEvents, it should not return an error', function () {
        var args = {groupSize: 25};
        var call = callService.groupTikTokEvents(args);
        assert.isFalse(call.error);
    });
});
