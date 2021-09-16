'use strict';

/**
 * The onRequest hook is called with every top-level request in a site. This happens both for requests to cached and non-cached pages.
 * For performance reasons the hook function should be kept short.
 *
 * @module  request/OnRequest
 */
var ltkActivityTracking = require('*/cartridge/controllers/ltkActivityTracking.js');
var Status = require('dw/system/Status');

/**
 * The onRequest hook function.
 * @returns {*} results
 */
exports.onRequest = function () {
    ltkActivityTracking.TrackRequest();
    return new Status(Status.OK);
};
