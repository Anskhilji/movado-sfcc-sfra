'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);
var Template = require('dw/util/Template');

server.replace('Load', function (req, res, next) {
    var components = (JSON.parse(req.querystring.components));
    var limit = parseInt(req.querystring.limit);
    var successfulrenderings = 0;
    components.forEach(function (component) {
        if (limit && limit <= successfulrenderings) {
            return;
        }
        var model = new dw.util.HashMap();

        if (component.model.type === 'product') {
            var product = dw.catalog.ProductMgr.getProduct(component.model.id);
            if (!product || !product.online) {
                return;
            }
            /**
             * Custom Start: Removed product view modal and semdig productID 
             * model = ProductViewModel.get(product);
             */
            model.productID = component.model.id;

            /**
             * Custom End:
             */
        }

        var template = new Template('experience/components/' + component.template);
        var renderedTemplate = template.render(model);
        response.writer.print(renderedTemplate.text);
        successfulrenderings++;
    });
});

module.exports = server.exports();
