'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

server.replace('ShowAvailability', function (req, res, next) {
    var ABTestMgr = require('dw/campaign/ABTestMgr');
    var template;
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    if (ABTestMgr.isParticipant('MovadoRedesignPDPABTest','Control')) {
        template = 'product/old/components/showAvailability';
    } else if (ABTestMgr.isParticipant('MovadoRedesignPDPABTest','render-modern-design')) {
        template = 'product/traditional/components/showAvailability';
    } else if (ABTestMgr.isParticipant('MovadoRedesignPDPABTest','render-traditional-design')){
        template = 'product/traditional/components/showAvailability';
    } else {
        template = 'product/old/components/showAvailability';
    }
    res.render(template, {
        product: showProductPageHelperResult.product
    });
    next();
});

module.exports = server.exports();