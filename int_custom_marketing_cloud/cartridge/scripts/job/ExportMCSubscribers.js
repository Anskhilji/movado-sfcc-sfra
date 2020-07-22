'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger').getLogger('MarketingCloud');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');

var Constants = require('int_custom_marketing_cloud/cartridge/scripts/util/Constants.js');
var SFMCApi = require('~/cartridge/scripts/api/SFMCApi');
var SFMCAPIHelper = require('~/cartridge/scripts/helper/SFMCAPIHelper');
var SFMCCOHelper = require('~/cartridge/scripts/helper/SFMCCOHelper');

function exportAllSavedSubscribers() {
    var isMovadoOrOB = false;
    var eventService;
    var dataExtensionService;
    var batchResult = true;
    var subscriber;

    var params = {
        email: null,
        isExpired: false,
        isJob: true,
        eventDefinationKey: Site.current.getCustomPreferenceValue('mcEventDefinationKey'),
        accountID: Site.current.getCustomPreferenceValue('mcAccountID'),
        dataExtensionKey: Site.current.getCustomPreferenceValue('mcDataExtensionKey'),
        authServiceID: Constants.SERVICE_ID.BATCH_AUTH
    }
    var accesToken = SFMCAPIHelper.getAuthToken(params);
    var contactService = SFMCAPIHelper.getDataAPIService(Constants.SERVICE_ID.BATCH_DATA, Constants.SFMC_DATA_API_ENDPOINT.CONTACT, accesToken, Constants.SFMC_SERVICE_API_TYPE.CONTACT);
    if (Site.current.ID === 'MovadoUS' || Site.current.ID === 'OliviaBurtonUS' || Site.current.ID === 'OliviaBurtonUK' || Site.current.ID === 'MCSUS') {
        eventService = SFMCAPIHelper.getDataAPIService(Constants.SERVICE_ID.BATCH_DATA, Constants.SFMC_DATA_API_ENDPOINT.EVENT, accesToken, Constants.SFMC_SERVICE_API_TYPE.EVENT);
        isMovadoOrOB = true;
    } else {
        var endpoint = Constants.SFMC_DATA_API_ENDPOINT.DATA_EXTENSION.replace('{dataExtensionKey}', params.dataExtensionKey);
        dataExtensionService = SFMCAPIHelper.getDataAPIService(Constants.SERVICE_ID.BATCH_DATA, endpoint, accesToken, Constants.SFMC_SERVICE_API_TYPE.DATA_EXTENSION);
    }

    var mcSubscribersObjectIterator = SFMCCOHelper.getEmailSubscribers();
    while (mcSubscribersObjectIterator.hasNext()) { 
        try {
            subscriber = mcSubscribersObjectIterator.next();
            if (subscriber) {
                
                
                if (Site.current.ID === 'MVMTUS' || Site.current.ID === 'MVMTEU') {
                    var result;
                    var service;
                    
                    service = SFMCAPIHelper.getDataAPIService(Constants.SERVICE_ID.UPDATE_DATA, '', accesToken, Constants.SFMC_SERVICE_API_TYPE.DATA_EXTENSION);
                    var payload = JSON.parse(subscriber.custom.mcPayload);
                    params.email = !empty(payload.email) ? payload.email : '';
                    params.country = !empty(payload.country) ? payload.country : '';
                    params.firstName = !empty(payload.firstName) ? payload.firstName : '';
                    params.lastName = !empty(payload.lastName) ? payload.lastName : '';
                    params.campaignName = !empty(payload.campaignName) ? payload.campaignName : '';
                    params.birthday = !empty(payload.birthday) ? payload.birthday : '';
                    params.gender = !empty(payload.gender) ? payload.gender : '';
                    params.phoneNumber = !empty(payload.phoneNumber) ? payload.phoneNumber : '';
                    params.eventName = !empty(payload.eventName) ? payload.eventName : '';
                    if (!empty(params)) {
                        result = SFMCAPIHelper.updateEvent(params, service);
                        if (result.success === true) {
                            Transaction.wrap(function () {
                                CustomObjectMgr.remove(subscriber);
                            });
                        }
                    }
                } else {
                    params.email = subscriber.custom.email;
                    var result = SFMCAPIHelper.addContactToMC(params, contactService);
                    if (!result.success) {
                        continue;
                    }
                    if (isMovadoOrOB) {
                        result = SFMCAPIHelper.addContactToJourney(params, eventService);
                    } else {
                        result = SFMCAPIHelper.addContactToDataExtension(params, dataExtensionService);
                    }
                    
                    if (result.success === true || result.message == Resource.msg('newsletter.email.error.subscription.exist', 'common', null)) {
                        Transaction.wrap(function () {
                            CustomObjectMgr.remove(subscriber);
                        });
                    }
                }
            }
       } catch (e) {
           Logger.debug('MarketingCloud: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
           batchResult = false;
       }
   }
    return batchResult;
}

function execute() {
    var result = exportAllSavedSubscribers();
    if (result) {
        return new Status(Status.OK);
    } else {
        return new Status(Status.ERROR);
    }
}

module.exports.execute = execute;
