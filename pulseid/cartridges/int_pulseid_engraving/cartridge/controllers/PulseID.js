'use strict';

var server = require('server');

var ProductMgr = require('dw/catalog/ProductMgr');

var pulseIdAPI = require('*/cartridge/scripts/api/pulseIdAPI');
var pulseIdConstants = require('*/cartridge/scripts/utils/pulseIdConstants');
var pulseIdRequestGenerator = require('*/cartridge/scripts/generators/pulseIdRequestGenerator');

server.post('Preview', function (req, res, next) {
    var line1Text = req.form.line1Text;
    var line2Text = req.form.line2Text;
    var productId = req.form.productId;

    if (!empty(line1Text) || !empty(line2Text)) {
        var product = ProductMgr.getProduct(productId);

        var templateCode = !empty(product.custom.pulseIDTemplateId) ? product.custom.pulseIDTemplateId : '';
        var productCode = !empty(product.custom.pulseIDProductCode) ? product.custom.pulseIDProductCode : '';
        var location = pulseIdConstants.PULSEID_SERVICE_ID.LOCATION;
        var elementName1 = pulseIdConstants.PULSEID_SERVICE_ID.LINE1;
        var elementName2 = pulseIdConstants.PULSEID_SERVICE_ID.LINE2;

        var payLoad = pulseIdRequestGenerator.pulseIdPayload(templateCode, productCode, location, elementName1, elementName2, line1Text, line2Text);
        // Making the API call to helper function to generate the payload of redner api and call the service 
        var pulseIdAPiResult = pulseIdAPI.pulseIdEngravingApi(payLoad, pulseIdConstants.PULSEID_SERVICE_ID.PULSEID_ENGRAVING_URL, pulseIdConstants.PULSEID_SERVICE_ID.PULSEID_REQUEST_METHOD);
        if (!empty(pulseIdAPiResult) && pulseIdAPiResult.success) {
            res.json({
                result: pulseIdAPiResult
            });
        } else {
            res.json({
                result: pulseIdAPiResult
            });
        }

    }
    return next();
});

server.post('SetSession', function (req, res, next) {
    var line1Text = req.form.line1Text;
    var line2Text = req.form.line2Text;
    var productId = req.form.productId;
    var previewUrl = req.form.previewUrl
    // set session for apple pay
    req.session.raw.custom.appleProductId = productId ? productId : '';
    req.session.raw.custom.appleEngraveOptionId = pulseIdConstants.PULSEID_SERVICE_ID.ENGRAVED_OPTION_PRODUCT_VALUE_ID;
    req.session.raw.custom.appleEngravedMessage = (line1Text ? line1Text : '') + '\n' + (line2Text ? line2Text : '');
    req.session.raw.custom.pulseIDPreviewURL = previewUrl ? previewUrl : '';
});

module.exports = server.exports();