'use strict';

/**
*
*	 This is the Delete Order service to communicate with Yotpo
*
*/
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var yotpoDeleteOrdersSvc = LocalServiceRegistry.createService('int_yotpo.https.post.delete.purchase.api', {

    createRequest: function (svc, args) {
        svc.addHeader('Content-Type', 'application/json; charset=utf-8');
        svc.addHeader('Accept', '*/*');
        svc.addHeader('Accept-Encoding', 'gzip,deflate');
        svc.setRequestMethod('DELETE');

        return args;
    },

    parseResponse: function (svc, client) {
        return client.text;
    },

    // Hide sensitive data in server request and response logs
    getRequestLogMessage: function (reqObj) {
        var requestJSON = JSON.parse(reqObj);

        return JSON.stringify(requestJSON);
    }
});

exports.yotpoDeleteOrdersSvc = yotpoDeleteOrdersSvc;
