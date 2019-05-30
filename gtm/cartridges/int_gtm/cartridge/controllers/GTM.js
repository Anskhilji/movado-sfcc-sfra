/**
* Description of the Controller and the logic it provides
*
* @module  controllers/GTM
*/

'use strict';

var server = require('server');


/**
 * Creates an GTM model
 * @param {Object} req - local instance of request object
 * @returns {Object} a plain object of the current customer's account
 */
function getModel(req) {
    var gtmModel = require('*/cartridge/models/gtm');
    var Locale = require('dw/util/Locale');
    return new gtmModel(req);
}

server.get(
    'LoadDataLayer',
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');
        var gtmModel = getModel(req);
        res.render('/gtm_header', {
            gtm: gtmModel

        });
        next();
    }
);
server.get(
    'LoadGTMTag',
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');
        var request = req;

        res.render('/gtmtags', {

        });
        next();
    }
);
module.exports = server.exports();

