'use strict';

var customObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var UUIDUtils = require('dw/util/UUIDUtils');
var Logger = require('dw/system/Logger');

var constants = require('~/cartridge/scripts/utils/Constants');

/**
 * Gets all Beam Objs
 * @returns {dw.util.SeekableIterator} Beam
 */
function getBeamObjs() {
    var beamObjs = customObjectMgr.getAllCustomObjects(constants.BEAM_ORDERS);
    return beamObjs;
}

/**
 * Removes custom object from system
 * @param {Object} backInStockNotificationObj - BackInStockNotification custom Object
 */
function removeBeamObjs(beamObj) {
    try {
        Transaction.wrap(function () {
            customObjectMgr.remove(beamObj);
        });
    } catch (error) {
        Logger.error('Error occured while removing BeamObj Object. \n  Object: {0} \n Error: {1} \n Stack Trace: {2}',
            JSON.stringify(beamObj), error.message, error.stack);
    }
}

/**
 * Created new Beam Object
 * @param {Object} beamObject 
 * @returns {Boolean} success
 */
function saveBeamObj(beamObject) {
    var success = false;

    var UUID = UUIDUtils.createUUID();
    try {
        if (!empty(beamObject.charityId) && !empty(beamObject.orderId)) {
            Transaction.wrap( function() {
                var beamObj = customObjectMgr.createCustomObject(constants.BEAM_ORDERS, UUID);
                beamObj.custom.charityId = beamObject.charityId;
                beamObj.custom.orderId = beamObject.orderId;
                success = true;
            });
        }
    } catch (error) {
        success = false;
        Logger.error('Error occured while saving Beam object: {0} \n Error: {1} \n Stack Trace : {2}',
            JSON.stringify(beamObject), error.message, error.stack);
    }
    return success;
}

module.exports = {
    saveBeamObj: saveBeamObj,
    getBeamObjs: getBeamObjs,
    removeBeamObjs: removeBeamObjs
}