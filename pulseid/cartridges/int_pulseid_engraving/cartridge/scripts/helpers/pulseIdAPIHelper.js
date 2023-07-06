'use strict';
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger').getLogger('PulseID', 'PluseID');
var Transaction = require('dw/system/Transaction');
var UUIDUtils = require('dw/util/UUIDUtils');

var pulseIdConstants = require('*/cartridge/scripts/utils/pulseIdConstants');

function pulseIdAPICall(payLoad, service) {
    var responsePayload = null;

    var result = {
        success: false,
        response: null
    }

    try {
        responsePayload = service.call(payLoad);
    } catch (e) {
        Logger.error('Error Occured While Calling pulseId API and Error is {0}: fileName: {1}', e.toString(), e.fileName);
    }

    if (!responsePayload.error) {
        result.success = true;
        result.response = responsePayload.object;
        result.status = responsePayload.status;
    } else {
        result.success = false;
        result.message = responsePayload.errorMessage;
        Logger.error('PulseId API returns Error on Call : {0}', responsePayload.errorMessage);
    }
    return result;
}

/**
 * Gets all PulseID Objs
 * @returns {dw.util.SeekableIterator}
 */
function getPulseObjs() {
    var pulseObjs = CustomObjectMgr.getAllCustomObjects(pulseIdConstants.PULSE_ID_CUSTOM_OBJ);
    return pulseObjs;
}

function removePulseObjs(pulseObj) {
    try {
        Transaction.wrap(function () {
            CustomObjectMgr.remove(pulseObj);
        });
    } catch (error) {
        Logger.error('Error occured while removing PulseID Object. \n  Object: {0} \n Error: {1} \n Stack Trace: {2}',
            JSON.stringify(pulseObj), error.message, error.stack);
    }
}

/**
 * Created new Pulse Object
 * @param {Object} pulseObject 
 * @returns {Boolean} success
 */
function savePulseObj(orderID) {
    var UUID = UUIDUtils.createUUID();
    try {
        if (!empty(orderID)) {
            Transaction.wrap(function () {
                var pulseCustomObject = CustomObjectMgr.createCustomObject(pulseIdConstants.PULSE_ID_CUSTOM_OBJ, UUID);
                pulseCustomObject.custom.orderId = orderID;
            });
        }
    } catch (error) {
        Logger.error('Error occured while saving pulseID object: {0} \n Error: {1} \n Stack Trace : {2}',
            JSON.stringify(orderID), error.message, error.stack);
    }
}

function setPulseJobID(order) {
    if (order && order.productLineItems.length > 0) {

        Transaction.wrap(function () {
            for (var i = 0; i < order.productLineItems.length; i++) {
                var optionProductLineItems = order.productLineItems[i].optionProductLineItems.toArray();
                var pulseIDJobId = order.orderNo + pulseIdConstants.PULSE_JOBID_SEPARATOR + order.productLineItems[i].productID + pulseIdConstants.PULSE_JOBID_SEPARATOR + order.productLineItems[i].position;
                optionProductLineItems.filter(function (optionItem) {
                    if (optionItem.optionID == pulseIdConstants.ENGRAVING_ID) {
                        order.custom.IsPulseIDEngraved = true;
                        optionItem.custom.pulseIDJobId = pulseIDJobId;
                        return;
                    }
                });
            }
        });
    }
}

function setOptionalLineItemUUID(modelItems, product) {
    if (modelItems.items.length > 0 && !empty(product)) {
        try {
            modelItems.items.forEach(function (item) {

                if (item.id == product.productID) {
                    var optionProductLineItems = product.getOptionProductLineItems().iterator();

                    while (optionProductLineItems.hasNext()) {
                        var optionProduct = optionProductLineItems.next();

                        item.options.forEach(function (option) {

                            if (option.optionId == pulseIdConstants.ENGRAVING_ID && optionProduct.optionID == pulseIdConstants.ENGRAVING_ID) {
                                var engraveMessageLine1 = !empty(optionProduct.custom.engraveMessageLine1) ? optionProduct.custom.engraveMessageLine1 : product.custom.engraveMessageLine1 ? product.custom.engraveMessageLine1 : '';
                                var engraveMessageLine2 = !empty(optionProduct.custom.engraveMessageLine2) ? optionProduct.custom.engraveMessageLine2 : product.custom.engraveMessageLine2 ? product.custom.engraveMessageLine2 : '';

                                option.UUID = optionProduct.UUID;
                                option.custom = {
                                    engraveMessageLine1: engraveMessageLine1,
                                    engraveMessageLine2: engraveMessageLine2
                                }
                            }
                        });
                    }
                }
            });
        } catch (e) {
            Logger.error("Error occurred while trying to add custom product engraving option custom att value into order items option custom attr, line number: {0}, file name is: {1} and the error message is: {2}", e.lineNumber, e.fileName, e.message);
        }
    }
}

module.exports = {
    savePulseObj: savePulseObj,
    getPulseObjs: getPulseObjs,
    removePulseObjs: removePulseObjs,
    pulseIdAPICall: pulseIdAPICall,
    setPulseJobID: setPulseJobID,
    setOptionalLineItemUUID: setOptionalLineItemUUID
}