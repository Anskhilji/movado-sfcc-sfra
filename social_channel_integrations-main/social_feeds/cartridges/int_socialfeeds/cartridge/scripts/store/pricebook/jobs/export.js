'use strict';

const Status = require('dw/system/Status');
const Logger =  require('dw/system/Logger').getLogger('int_socialfeeds', 'StorePricebook:export');
const FileHelper = require('int_socialfeeds/cartridge/scripts/helpers/FileHelper.js');
const File = require('dw/io/File');
const PriceBookMgr = require('dw/catalog/PriceBookMgr');
const SiteID = require('dw/system/Site').getCurrent().ID;

/**
 * Exports Store Specific Pricebooks based on Assignments Framework
 * @param {Array} args job arguments
 * @param {String} args.FolderPath output folder
 * @returns {dw.system.Status} Exit status for a job run
 */
exports.execute = function (args) {

    const FileReader = require('dw/io/FileReader');
    const HashSet = require('dw/util/HashSet');
    const HashMap = require('dw/util/HashMap');

    const XMLStreamReader = require('dw/io/XMLStreamReader');
    const XMLStreamConstants = require('dw/io/XMLStreamConstants');

    if (!args.FolderPath) {
        Logger.error('Invalid parameters supplied to the job step');
        return new Status(Status.ERROR, 'ERROR', 'Invalid input parameters');
    }
    try {
        var baseDir = FileHelper.addImpexPath(args.FolderPath);
        var assignmentsDir = baseDir + File.SEPARATOR + 'assignments';
        var pricingDir = baseDir + File.SEPARATOR + 'store' + File.SEPARATOR + 'pricing';
        var workDir = pricingDir + File.SEPARATOR + 'work' + File.SEPARATOR + SiteID;
        var inputDir = workDir + File.SEPARATOR + 'input';
        var outputDir = workDir + File.SEPARATOR + 'output';
        var priceBookExportDir = inputDir + File.SEPARATOR + 'pricebooks';

        var assignmentXMLFile;

        if(FileHelper.isFileExists(assignmentsDir, 'assignments.xml')) {
            assignmentXMLFile = new File(assignmentsDir + File.SEPARATOR + 'assignments.xml');
        } else {
            Logger.error('Assignments file does not exist in the expected folder');
            return new Status(Status.ERROR, 'ERROR', 'Assignments file does not exist');
        }

        FileHelper.createDirectory(inputDir);
        var xmlReader = new XMLStreamReader(new FileReader(assignmentXMLFile));
        var eventType,
            elementName,
            currentElement,
            data,
            text;

        var results = [];
        var pricebooksSet = new HashSet();
        var currentDate = new Date();
        var assignmentObj;


        // Loop through the XML file and process each assignment element
        while (xmlReader.hasNext()) {
            eventType = xmlReader.next();
            if (eventType == XMLStreamConstants.START_ELEMENT) {
                elementName = xmlReader.getLocalName();
                if (elementName === 'assignment') {
                    var ns = new Namespace(xmlReader.getNamespaceURI());
                    assignmentObj = xmlReader.readXMLObject().removeNamespace(ns);
                    data = processAssignment(assignmentObj, ns, currentDate, SiteID);
                    if(data) {
                        results.push(data);
                    }
                }
            }
        }

        //iterate through results array and create a export list
        Logger.debug(JSON.stringify(results));

        var storeExportMap = new HashMap();

        for (var i = 0; i < results.length; i++) {
            data = results[i].stores;
            results[i].stores.forEach(function(store) {
                if(!storeExportMap.containsKey(store)) {
                    storeExportMap.put(store, new HashSet());
                }
                results[i].pricebooks.forEach(function(pricebook) {
                    storeExportMap.get(store).add1(pricebook);
                });
            });
            results[i].pricebooks.forEach(function(pricebook) {
                pricebooksSet.add1(pricebook);
            });
        }

        results = null;
        data = null;

        var pricebooks = pricebooksSet.toArray();

        exportPricebooks(pricebooks, priceBookExportDir);

        exportStorePricing(storeExportMap, priceBookExportDir, outputDir, pricingDir);


    } catch(e) {
        Logger.error('error while generating store specific pricing:' + e);
        return new Status(Status.ERROR, 'ERROR', 'Error while generating store specific pricing');
    } finally {
        xmlReader && xmlReader.close();
    }
    return new Status(Status.OK, 'OK');
}

var processComplexElement = function(obj, arr) {
    var elements = obj.children().text();
    if(elements) {
        for(var index = 0; index < elements.length(); index++) {
            var element = elements[index];
            if(element && !empty(element.toString())) {
                arr.push(element.toString());
            }
        }
    }
}

function processAssignment(assignmentObj, ns, currentDate, SiteID) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var successResponse = true;
    var data = {
        assignmentID: '',
        startDate: '',
        endDate: '',
        enabled: false,
        assignedSites: [],
        pricebooks: [],
        stores: []
    };
    var x = function(name) {
        return new QName(ns, name);
    }
    try {

        data.assignmentID = assignmentObj.attribute('assignment-id').toString();
        data.enabled = assignmentObj.child(x('enabled-flag')).text().toString();
        data.startDate = assignmentObj.child(x('start-date')).text().toString();
        data.endDate = assignmentObj.child(x('end-date')).text().toString();

        if(!data.enabled) {
            return !successResponse;
        }

        if(!empty(data.startDate)) {
            var startDate = new Date(data.startDate);
            if (startDate > currentDate) {
                return !successResponse;
            }
        }

        if(!empty(data.endDate)) {
            var endDate = new Date(data.endDate);
            if (endDate < currentDate) {
                return !successResponse;
            }
        }

        processComplexElement(assignmentObj.child(x('assigned-sites')), data.assignedSites);
        processComplexElement(assignmentObj.child(x('experiences')).child(x('pricebooks')), data.pricebooks);
        processComplexElement(assignmentObj.child(x('qualifiers')), data.stores);

        if(data.assignedSites.length === 0 || data.assignedSites.indexOf(SiteID) === -1) {
            return !successResponse;
        }

        for (var i = 0; i < data.stores.length; i++) {
            var store = data.stores[i];
            if (empty(StoreMgr.getStore(store))) {
              Logger.debug('Removing store:' + store + ' from array');
              data.stores.splice(i, 1);
              i--;
            }
        }

        if(data.stores.length === 0) {
            return !successResponse;
        }

        for (var i = 0; i < data.pricebooks.length; i++) {
            var pricebook = data.pricebooks[i];
            if (empty(PriceBookMgr.getPriceBook(pricebook))) {
              Logger.debug('Removing pricebook:' + store + ' from array');
              data.pricebooks.splice(i, 1);
              i--;
            }
        }
        if(data.pricebooks.length === 0) {
            return !successResponse;
        }

        return data;

    } catch(e) {
        Logger.error("Error while processing assignment-id:" + data.assignmentID + "with error:" + e);
        return false;
    }

    return response;
}

function exportPricebooks(pricebooks, path) {
    var ArrayList = require('dw/util/ArrayList');
    var basePath = 'IMPEX/src/';
    var priceBookExportDir = path;

    FileHelper.createDirectory(priceBookExportDir);
    if(priceBookExportDir.indexOf(basePath) > -1) {
        priceBookExportDir = priceBookExportDir.slice(basePath.length);
    }
    if(!pricebooks || pricebooks.length === 0) {
        return false;
    }

    var pricebookArr;
    var parameters;
    var extension = '.xml';
    pricebooks.forEach(function(id) {
        pricebookArr = new ArrayList();
        pricebookArr.add1(PriceBookMgr.getPriceBook(id));
        parameters = {
            PriceBooks: pricebookArr.iterator(),
            ExportFile: priceBookExportDir + File.SEPARATOR + id + extension
        };
        try {
            require('dw/system/Pipeline').execute('CustomFeeds-ExportPricebooks', parameters);
        } catch(e) {
            Logger.error('Error while exporting pricebook:' + id + ":error:" + e)
        }
    });

    return true;
}

function exportStorePricing(storeExportMap, priceBookExportDir, outputDir, pricingDir) {
    var stores = storeExportMap.keySet();
    var pbFile;

    stores.toArray().forEach(function(store) {
        var storeDir = outputDir + File.SEPARATOR + store;
        storeDir = FileHelper.createDirectory(storeDir);
        var pricebooks = storeExportMap.get(store).toArray();
        pricebooks.forEach(function(pricebook) {
            pbFile = FileHelper.getFiles(priceBookExportDir, pricebook + '.xml');
            FileHelper.copyFile(new File(pbFile[0]), storeDir);
        });
    });

    var zipFile = pricingDir + File.SEPARATOR + 'storepricing-' + SiteID + '.zip';
    zipFile = new File(zipFile);
    FileHelper.removeFile(zipFile);
    var outputDirFile = new File(outputDir);
    outputDirFile.zip(zipFile);

    FileHelper.removeFile(new File(pricingDir + File.SEPARATOR + 'work'));
}
