var File = require('dw/io/File');
var Status = require('dw/system/Status');
var FileWriter = require('dw/io/FileWriter');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var HTTPClient = require('dw/net/HTTPClient');
var SeekableIterator = require('dw/util/SeekableIterator');
var SystemObjectMgr = require('dw/object/SystemObjectMgr');
var Store = require('dw/catalog/Store');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');

var StepUtil = require('*/cartridge/scripts/util/StepUtil');
var GoogleMapService = require('app_custom_movado/cartridge/scripts/googleMapService');

/**
 * This function will get list of stores from system and write the Lat and long. of stores in file.
 *
 * @returns
 */
function run() {
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

    var stores = SystemObjectMgr.querySystemObjects('Store', '(latitude = NULL OR longitude = NULL OR latitude = 0 OR longitude = 0)', null);

    try {
        if (stores.count >= 0) {
	    	// create  target Folder folder if it doesn't exist
	        new File([File.IMPEX, targetFolder].join(File.SEPARATOR)).mkdirs();

	        // Initializations
	        var filename = filePrefix + '_' + new Date().getTime() + '.xml';
	    	var writer = new FileWriter(new File(File.IMPEX + '/' + targetFolder + '/' + filename), 'UTF-8');
	    	var xsw = new XMLStreamWriter(writer);
	    	var i = 0;
            var address,
                components,
                result,
                response;

			// create XML
            xsw.writeStartDocument();
            xsw.writeStartElement('stores');
            xsw.writeNamespace('xmlns', 'http://www.demandware.com/xml/impex/store/2007-04-30');

			// Perform query for stores in collection
            while (stores.hasNext()) {
                var store = stores.next();
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

					// add params to service
                    service = service.addParam('sensor', 'false');
                    service = service.addParam('address', address);
                    if (!empty(components))						{ service = service.addParam('component', components); }
                    service = service.addParam('key', Site.getCurrent().getCustomPreferenceValue('GMapServerAPIKey'));

					// service call and result
                    result = service.call();

					// updating xml file with store lat_long details
                    if (result.ok) {
						// parsed response json object
                        response = result.object;
                        if (!empty(response.results) && !empty(response.results[0].geometry.location)) {
                            //Logger.error('store.ID: ' + store.ID);
                            xsw.writeStartElement('store');
                            xsw.writeAttribute('store-id', store.ID);
                            xsw.writeStartElement('latitude');
                            xsw.writeCharacters(response.results[0].geometry.location.lat);
                            xsw.writeEndElement();
                            xsw.writeStartElement('longitude');
                            xsw.writeCharacters(response.results[0].geometry.location.lng);
                            xsw.writeEndElement();
                            xsw.writeEndElement();
                        } else {
                            Logger.error('zero results for ' + store.ID + ' : ' + address + components + ' => ' + result.errorMessage + 'Error: ' + response.error_message + 'Status: ' + response.status);
                        }
                    } else {
                        Logger.error('failed to get geolocation results: ' + address + components + ' => ' + result.errorMessage);
                        throw 'failed to get geolocation results: Error=>' + result.errorMessage;
                    }
                }
                i++;
	    }
	    }
    } catch (e) {
        throw 'Exception: ' + e.message;
    }	finally {
    	// Closing stream writer to xml
        xsw.writeEndElement();
        xsw.writeEndDocument();
        xsw.close();
        writer.close();
    }
}


// Exports
exports.run = run;
