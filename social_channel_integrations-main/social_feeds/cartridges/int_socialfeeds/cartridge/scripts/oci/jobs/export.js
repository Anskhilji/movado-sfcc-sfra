'use strict';

var Status = require('dw/system/Status');
var Logger =  require('dw/system/Logger').getLogger('bm_socialfeeds', 'OCI:export');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var config = require('../oci.config');
var ServiceMgr = require('../services/ServiceMgr');
var Helper = require('../util/helpers');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');
var FileHelper = require('int_socialfeeds/cartridge/scripts/helpers/FileHelper.js');

/**
 * Initiates OCI Inventory Export
 * @param {Array} args job arguments
 * @returns {dw.system.Status} Exit status for a job run
 */
exports.trigger = function (args) {
    var token,
        locIds,
        locGroupIds,
        fullExportService,
        payload,
        result,
        co,
        dataJSON;

    co = Helper.getConfigCO(args.OCICustomObjectId);

    if (!(co.custom.LocationIds || co.custom.LocationGroupIds)) {
        Logger.error("Both LocationIds and LocationGraphIds can't be empty");
        return new Status(Status.ERROR, 'ERROR', 'Input Error');
    }
    try {
        token = Helper.getAccessToken({
            "OrgId": Helper.getOrgId(co)
        });
    } catch(e) {
        Logger.error("Error retriving the access token:" + e);
        return new Status(Status.ERROR, 'ERROR', 'Access Token Error');
    }

    if(!token) {
        return new Status(Status.ERROR, 'ERROR', 'Access Token Error');
    }

    locIds = co.custom.LocationIds && co.custom.LocationIds.split(",");
    locGroupIds = co.custom.LocationGroupIds && co.custom.LocationGroupIds.split(",");
    fullExportService = ServiceMgr.getFullExportService();

    //reset the dataJSON
    dataJSON = config.customObject.defaultDataJSON;

    try {
        if (locIds && locIds.length > 0) {
            payload = {
                "objects": {
                    "locations": locIds
                }
            }
            result = fullExportService.call({
                token: token,
                body: payload
            });
            if (result.status === 'OK' && !empty(result.object)) {
                // save the response in custom object
                dataJSON.exportResult.locations = result.object;
            }

        }
        if (locGroupIds && locGroupIds.length > 0) {
            payload = {
                "objects": {
                    "groups": locGroupIds
                }
            }
            result = fullExportService.call({
                token: token,
                body: payload
            });
            if (result.status === 'OK' && !empty(result.object)) {
                // save the response in custom cache
                dataJSON.exportResult.locationGroups = result.object;
            } else {
                Logger.error("Error triggerring the export");
                return new Status(Status.ERROR, 'ERROR', 'Exception in Export Trigger Service');
            }
        }
    } catch(e) {
        Logger.error("Error triggerring the export:" + e);
        return new Status(Status.ERROR, 'ERROR', 'Exception in Export Trigger');
    }
    Transaction.wrap(function() {
        co.custom.dataJSON = JSON.stringify(dataJSON);
    });
    return new Status(Status.OK, 'OK', 'Export Triggered');
};

/**
 * Downloads OCI Inventory Export after it has been triggered
 * @param {Array} args job arguments
 * @param {String} args.FolderPath folder path
 * @returns {dw.system.Status} Exit status for a job run
 */
exports.download = function (args) {
    var token,
        result,
        locationCache,
        groupCache,
        file,
        co,
        deltaTokenLocations,
        deltaTokenGroups,
        dataJSON;
    try {
        co = Helper.getConfigCO(args.OCICustomObjectId);

        token = Helper.getAccessToken({
            "OrgId": Helper.getOrgId(co)
        });

        dataJSON = JSON.parse(co.custom.dataJSON);

        // get the export status links from the custom Object

        if(!(empty(dataJSON) ||
            dataJSON.exportResult.locations ||
            dataJSON.exportResult.locationGroups)) { //if there is no running export job, error out
                Logger.error("No OCI export is running. Please initiate an export first.");
                return new Status(Status.ERROR, 'ERROR', 'No Inventory Available to Download');
        }

        locationCache = dataJSON.exportResult.locations;
        groupCache = dataJSON.exportResult.locationGroups;

        var siteId = Site.getCurrent().getID();

        if(locationCache && locationCache.exportStatusLink) {
            file = FileHelper.createFile(args.FolderPath, config.filenames.locations, siteId);
            result = downloadInventory(token, locationCache.exportStatusLink, file);
            if(result) {
                deltaTokenLocations = retriveDeltaToken(file);
            }
        }

        if(groupCache && groupCache.exportStatusLink) {
            file = FileHelper.createFile(args.FolderPath, config.filenames.groups, siteId);
            result = downloadInventory(token, groupCache.exportStatusLink, file);
            if(result) {
                deltaTokenGroups = retriveDeltaToken(file);
            }
        }
    } catch(e) {
        Logger.error("Error downloading the inventory file:" + e);
        return new Status(Status.ERROR, 'ERROR', 'Inventory Download Error');
    }

    if(!result) {
        return new Status(Status.ERROR, 'ERROR', 'Exception in Inventory Download');
    }

    dataJSON['deltaTokenLocations'] = deltaTokenLocations;
    dataJSON['deltaTokenGroups'] = deltaTokenGroups;

    Transaction.wrap(function() {
        co.custom.dataJSON = JSON.stringify(dataJSON);
    });

    return new Status(Status.OK, 'OK', 'File(s) downloaded and saved');
}

/**
 * Downloads OCI delta Inventory Export using the token stored in the CacheMgr
 * @param {Array} args job arguments
 * @param {String} args.FolderPath folder path
 * @returns {dw.system.Status} Exit status for a job run
 */
exports.delta = function (args) {
    var deltaTokenLocations,
        deltaTokenGroups,
        token,
        co,
        dataJSON;

    co = Helper.getConfigCO(args.OCICustomObjectId);
    dataJSON = JSON.parse(co.custom.dataJSON);

    if(!dataJSON && !dataJSON['deltaTokenLocations'] && !dataJSON['deltaTokenGroups']) {
        Logger.error("Delta Tokens not available in the custom object");
        return new Status(Status.ERROR, 'ERROR', 'Inventory Download Error');
    }
    deltaTokenLocations = dataJSON['deltaTokenLocations'];
    deltaTokenGroups = dataJSON['deltaTokenGroups'];

    try {
        token = Helper.getAccessToken({
            "OrgId": Helper.getOrgId(co)
        });
    } catch(e) {
        Logger.error("Error retriving the access token:" + e);
        return new Status(Status.ERROR, 'ERROR', 'Access Token Error');
    }

    if(deltaTokenLocations) {
        dataJSON['deltaTokenLocations'] = saveDeltaFeed(args.FolderPath, config.filenames.deltaLocations, token, deltaTokenLocations);
    }

    if(deltaTokenGroups) {
        dataJSON['deltaTokenGroups'] = saveDeltaFeed(args.FolderPath, config.filenames.deltaGroups, token, deltaTokenGroups);
    }

    if(!dataJSON['deltaTokenLocations'] && !dataJSON['deltaTokenGroups']) {
        return new Status(Status.ERROR, 'ERROR', 'Exception in Inventory Download');
    }

    Transaction.wrap(function() {
        co.custom.dataJSON = JSON.stringify(dataJSON);
    });

    return new Status(Status.OK, 'OK', 'File(s) downloaded and saved');
}

/**
 * Calls OCI API to save the full export feed as file
 * @param {String} token Access token
 * @param {String} exportStatusLink Export link to the running export job
 * @param {dw.io.File} file file to save the inventory
 * @returns {Boolean} returns true or false based on download operation was successful or not
 */
function downloadInventory(token, exportStatusLink, file) {
    var downloadService,
        result,
        fileLink,
        response;

    downloadService = ServiceMgr.getDownloadService();
    result = downloadService.call({
        token: token,
        path: exportStatusLink
    });
    if (result.status === 'OK' && !empty(result.object)) {
        if(result.object.status !== 'COMPLETED') {
            Logger.info("Error downloading the inventory file. Export is still running");
            return false;
            //return new Status(Status.ERROR, 'WARN', 'Inventory Export has not finished. Rerun the download job in few minutes');
        } else {
            fileLink = result.object.download.downloadLink;
            response = downloadService.call({
                token: token,
                path: fileLink,
                file: file
            });
            if(response.status === 'OK') {
                return true;
            }
        }

    }
    Logger.error("Error downloading the inventory file. Export is still running");
    return false;
}

/**
 * Retrieve the Delta Token
 * @param {dw.io.File} file file to retrieve the deltaToken
 * @returns {String|undefined} return deltaToken if operation is success otherwise undefined
 */
function retriveDeltaToken(file) {
    var FileReader,
        reader,
        lastLine,
        nextLine,
        deltaToken;

    FileReader = require('dw/io/FileReader');
    reader = new FileReader(file);
    while (!empty(nextLine = reader.readLine())) {
        lastLine = nextLine;
    }
    reader.close();

    deltaToken = lastLine && JSON.parse(lastLine).deltaToken;

    if(deltaToken) {
        Logger.info("deltaToken retrieved - " + deltaToken);
        return deltaToken;
    }
    return;
}

/**
 * Saves Delta Feed into Impex and returns the next deltaToken
 * @param {String} folderPath folderpath for the delta file
 * @param {String} filename filename
 * @param {String} authToken Auth token for the delta service call
 * @param {String} deltaToken delta token which tracks the delta stream
 * @returns {String|undefined} return new deltaToken
 */
function saveDeltaFeed(folderPath, filename, authToken, deltaToken) {
    var queryAgain,
        file,
        result,
        deltaService,
        writer,
        newDeltaToken;

        queryAgain = false;

        try {
            var siteId = Site.getCurrent().getID();
            file = FileHelper.createFile(folderPath, filename, siteId);
            deltaService = ServiceMgr.getDeltaService();
            do {
                result = deltaService.call({
                    token: authToken,
                    body: {
                        "deltaToken": deltaToken
                    }
                });
                if (result.status === 'OK' && !empty(result.object)) {
                    if (result.object.shouldQueryAgain) {
                        queryAgain = result.object.shouldQueryAgain;
                        deltaToken = result.object.nextDeltaToken;
                    } else {
                        newDeltaToken = result.object.nextDeltaToken;
                        Logger.info(" new deltaToken " + newDeltaToken);
                    }

                    if (result.object.records && result.object.records.length > 0) {
                        writer = new FileWriter(file, true);
                        result.object.records.forEach(function(record) {
                            writer.writeLine(JSON.stringify(record));
                        });
                    }
                }

            } while(queryAgain);
        } catch(e) {
            Logger.error("Error downloading the delta inventory file:" + e);
            return false;

        } finally {
            if(writer) {
                writer.close();
            }
        }

    return newDeltaToken;
}
