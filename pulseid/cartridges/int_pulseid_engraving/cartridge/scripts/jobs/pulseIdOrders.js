'use strict';
var Logger = require('dw/system/Logger');
var OrderManager = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');


function execute() {
    var pulseIdConstants = require('*/cartridge/scripts/utils/pulseIdConstants');
    var pulseIdAPI = require('*/cartridge/scripts/api/pulseIdAPI');
    var pulseIdAPIHelper = require('*/cartridge/scripts/helpers/pulseIdAPIHelper');
    var pulseIdRequestGenerator = require('*/cartridge/scripts/generators/pulseIdRequestGenerator');

    try {
        var pulseObj;
        var jobs = [];
        var pulseObjs = pulseIdAPIHelper.getPulseObjs();

        while (pulseObjs.hasNext()) {
            pulseObj = pulseObjs.next();
            var orderID = pulseObj.custom.orderId;
            if (!empty(orderID)) {
                var order = OrderManager.getOrder(orderID);
                var lineItemsItr = order.getAllProductLineItems().iterator();
                while (lineItemsItr.hasNext()) {
                    var lineItem = lineItemsItr.next();
                    var optionProductLineItems = lineItem.optionProductLineItems.toArray();
                    optionProductLineItems.filter(function (optionItem) {
                        if (!empty(optionItem.custom.pulseIDJobId)) {
                            var ProductLineItemObj = pulseIdRequestGenerator.setProductLineItemObj(lineItem, optionItem);
                            jobs.push(ProductLineItemObj);
                        }
                    });
                }
                // generate pay load
                var payload = pulseIdRequestGenerator.generatePulseIdOrderPayload(order, jobs);
                //create service
                var result = pulseIdAPI.pulseIdEngravingApi(payload, pulseIdConstants.PULSEID_SERVICE_ID.PULSEID_SUBMIT_ORDER_API_ENDPOINT, pulseIdConstants.PULSEID_SERVICE_ID.PULSEID_REQUEST_METHOD);
                if (result.success) {
                    Logger.info('(pulseIdOrders Job) -> execute -> order has been submitted with order : ' + orderID + ' to PulseID. Response:' + result);
                    pulseIdAPIHelper.removePulseObjs(pulseObj);
                }
            }
        }

    } catch (e) {
        Logger.error('Error occured while executing PulseIDOrders job .\n Error: {0} \n Message: {1} \n lineNumber: {2} \n fileName: {3} \n orderNumber',
            e.stack, e.message, e.lineNumber, e.fileName, orderID);
        return new Status(Status.ERROR, 'ERROR', e.message);
    }
}

module.exports = {
    execute: execute
}