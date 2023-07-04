'use strict';
var pulseIdConstants = require('*/cartridge/scripts/utils/pulseIdConstants');

function pulseIdPayload(templateCode, productCode, location, elementName1, elementName2, line1Text, line2Text) {
    var payLoad = {
        "TemplateCode": templateCode,
        "ProductCode": productCode,
        "Location": location,
        "RenderOnProduct": true,
        "Personalizations": [{
                "ElementName": elementName1,
                "Text": line1Text,
                "IsText": true
            },
            {
                "ElementName": elementName2,
                "Text": line2Text,
                "IsText": true
            }
        ]
    };

    return JSON.stringify(payLoad);
}

function generatePulseIdOrderPayload(order, jobs) {

    var payload = {
        Company: pulseIdConstants.PULSEID_COMPANY_NAME,
        CustomerOrderNumber: order.orderNo,
        CustomerName: order.customerName,
        Address: order.shipments.length > 0 ? order.shipments[0].shippingAddress.address1 : '',
        City: order.shipments.length > 0 ? order.shipments[0].shippingAddress.city : '',
        State: order.shipments.length > 0 ? order.shipments[0].shippingAddress.stateCode : '',
        PostalCode: order.shipments.length > 0 ? order.shipments[0].shippingAddress.postalCode : '',
        ShippingMethod: order.shipments.length > 0 ? order.shipments[0].shippingMethod.displayName : '',
        CustomerTelNumber: order.shipments.length > 0 ? order.shipments[0].shippingAddress.phone : '',
        CustomerEmail: order.customerEmail,
        Jobs: jobs
    }

    return JSON.stringify(payload);
}

function setProductLineItemObj(lineItem, optionItem, elementName1, elementName2) {
    var obj = {
        Job: optionItem.custom.pulseIDJobId,
        Design: lineItem.productName,
        ProductCode: lineItem.productID,
        ProductPreviewURL: optionItem.custom.pulseIDPreviewURL,
        OrderType: lineItem.product.custom.OrderType,
        TemplateCode: lineItem.product.custom.pulseIDTemplateId,
        TemplateFile: lineItem.product.custom.TemplateFile,
        ProductLocation: lineItem.product.custom.ProductLocation,
        Quantity: 1,
        Personalizations: [{
                ElementName: elementName1,
                Text: optionItem.custom.engraveMessageLine1,
                IsText: true
            },
            {
                ElementName: elementName2,
                Text: optionItem.custom.engraveMessageLine2,
                IsText: true
            }
        ]
    }
    return obj;
}
module.exports = {
    pulseIdPayload: pulseIdPayload,
    generatePulseIdOrderPayload: generatePulseIdOrderPayload,
    setProductLineItemObj: setProductLineItemObj
}