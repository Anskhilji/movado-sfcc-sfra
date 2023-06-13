var File = require('dw/io/File');
var Status = require('dw/system/Status');
var FileWriter = require('dw/io/FileWriter');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var SystemObjectMgr = require('dw/object/SystemObjectMgr');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var Logger = require('dw/system/Logger');

var StepUtil = require('*/cartridge/scripts/util/StepUtil');
var GoogleMapService = require('app_custom_movado/cartridge/scripts/googleMapService');

var i = 0;
var address,
    stores,
    components,
    result,
    xsw,
    writer;

/**
 * This function will get list of stores from system and write the Lat and long. of stores in file.
 *
 * @returns
 */
exports.beforeStep = function (parameters, stepExecution) {
    var args = arguments[0];

    // Disabled step check
    if (StepUtil.isDisabled(args)) {
        return new Status(Status.OK, 'OK', 'Step disabled, skip it...');
    }

    // Load input Parameters
    var serviceID = args.ServiceID;
    var targetFolder = args.TargetFolder;
    var filePrefix = 'GeolocateStores';

    // Test mandatory parameters
    if (empty(serviceID) || empty(targetFolder)) {
        return new Status(Status.ERROR, 'ERROR', 'One or more mandatory parameters are missing.');
    }

    stores = SystemObjectMgr.querySystemObjects('Store', '(latitude = NULL OR longitude = NULL OR latitude = 0 OR longitude = 0)', null);

    if (stores.count >= 0) {
        // create  target Folder folder if it doesn't exist
        new File([File.IMPEX, targetFolder].join(File.SEPARATOR)).mkdirs();

        // Initializations
        var filename = filePrefix + '_' + new Date().getTime() + '.xml';
        writer = new FileWriter(new File(File.IMPEX + '/' + targetFolder + '/' + filename), 'UTF-8');
        xsw = new XMLStreamWriter(writer);

        // create XML
        xsw.writeStartDocument();
        xsw.writeStartElement('stores');
        xsw.writeNamespace('xmlns', 'http://www.demandware.com/xml/impex/store/2007-04-30');
    }
};

exports.read = function (parameters, stepExecution) {
    if (stores.hasNext()) {
        return stores.next();
    }
};

exports.process = function (store, parameters, stepExecution) {
    try {
        var responseCollection = {};
        // Perform query for stores in collection
        var service = GoogleMapService.getCoordinates(); // getCoordinates(serviceID) //This service needs to be updated.
        // enforce the daily limit here
        var limit = Site.getCurrent().getCustomPreferenceValue('googleGeolocationLimit');
        limit = !empty(limit) ? limit : 1000;

        if (i < limit) {
            // Get Params for service
            address = (!empty(StringUtils.trim(store.address1)) ? '+' + StringUtils.trim(store.address1).replace(' ', '+', 'g') : '');
            if (!empty(store.city)) {
                address += (!empty(StringUtils.trim(store.city)) ? '+' + StringUtils.trim(store.city).replace(' ', '+', 'g') + ',' : '');
            }
            if (!empty(store.stateCode)) {
                address += (!empty(StringUtils.trim(store.stateCode)) ? '+' + StringUtils.trim(store.stateCode).replace(' ', '+', 'g') : '');
            }
            components = (!empty(store.postalCode) && !empty(StringUtils.trim(store.postalCode)) ? 'postal_code:' + StringUtils.trim(store.postalCode).replace(' ', '+', 'g') : '');
            components += (!empty(store.countryCode) ? (!empty(components) ? '|' : '') + 'country:' + store.countryCode.value.replace(' ', '+', 'g') : '');
            responseCollection.address = address;
            responseCollection.store = store;
            responseCollection.components = components;
            // add params to service
            service = service.addParam('sensor', 'false');
            service = service.addParam('address', address);
            if (!empty(components))	{
                service = service.addParam('component', components);
            }
            service = service.addParam('key', Site.getCurrent().getCustomPreferenceValue('GMapServerAPIKey'));

            // service call and result
            result = service.call();
            // updating xml file with store lat_long details
            if (result.ok) {
                // parsed response json object
                responseCollection.serviceResponse = result.object;
                responseCollection.serviceResult = result;
            } else {
                Logger.error('failed to get geolocation results: ' + address + components + ' => ' + result.errorMessage);
                throw 'failed to get geolocation results: Error=>' + result.errorMessage;
            }
        }
        i++;
    } catch (e) {
        throw 'Exception: ' + e.message;
    }
    return responseCollection;
};

exports.write = function (response, parameters, stepExecution) {
    try {
        for (var j = 0; j < response.size(); j++) {
            if (!empty(response[j].serviceResponse.results) && !empty(response[j].serviceResponse.results[0]) && !empty(response[j].serviceResponse.results[0].geometry) && !empty(response[j].serviceResponse.results[0].geometry.location)) {
                //Logger.error('store.ID: ' + store.ID);
                xsw.writeStartElement('store');
                xsw.writeAttribute('store-id', response[j].store.ID);
                xsw.writeStartElement('latitude');
                xsw.writeCharacters(response[j].serviceResponse.results[0].geometry.location.lat);
                xsw.writeEndElement();
                xsw.writeStartElement('longitude');
                xsw.writeCharacters(response[j].serviceResponse.results[0].geometry.location.lng);
                xsw.writeEndElement();
                xsw.writeEndElement();
            } else {
                Logger.error('zero results for ' + response[j].store.ID + ' : ' + response[j].address + response[j].components + ' => ' + response[j].serviceResult.errorMessage);
            }
        }
    } catch (e) {
        throw 'Exception: ' + e.message;
    }
};

exports.afterStep = function (success, parameters, stepExecution) {
    // Closing stream writer to xml
    xsw.writeEndElement();
    xsw.writeEndDocument();
    xsw.close();
    writer.close();
};