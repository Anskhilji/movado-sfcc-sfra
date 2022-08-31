'use strict';
var CustomObjectMgr = function () {};

var customObjects = {
    ClydeJobConfigs: {
        ProductExportFull: {
            custom: {
                clydeLastRunTime: {
                    getTime: function () {
                        return 1568073600;
                    }
                }
            }
        }
    }
};

CustomObjectMgr.createCustomObject = function (type, name) {
    customObjects[type][name] = {
        custom: {
            clydeLastRunTime: {
                getTime: function () {
                    return 1568073600;
                }
            }
        }
    };

    return customObjects[type][name];
};

CustomObjectMgr.getCustomObject = function (type, name) {
    return customObjects[type][name];
};

module.exports = CustomObjectMgr;
