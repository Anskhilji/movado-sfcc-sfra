'use strict';

/**
 * Notifies TikTok about the successful feed generation via API call
 * @param {Array} args job arguments
 * @returns {dw.system.Status} Exit status for a job run
 */
exports.execute = function (args) {
    var Status = require('dw/system/Status');
    var tiktokService = require('int_tiktok/cartridge/scripts/services/tiktokService');
    var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
    var tikTokSettings = customObjectHelper.getCustomObject();
    var constants = require('../TikTokConstants');
    var path = require('dw/util/StringUtils').format(
        '{0}://{1}{2}{3}',
        "https",
        args.BMHostDomain,
        constants.IMPEX_DEFAULT_PATH,
        args.FileFolder || constants.FEED_PATHS[args.FeedType]
    );

    var successRespone = 'Notified Successfully';
    var failedResponse = 'Notification Service Failed';

    if(args.FeedType === 'product') {
        var latestRunDetails = getLatestProductFeedRunDetails(args.FileFolder || constants.FEED_PATHS[args.FeedType], args);
        if(latestRunDetails.error &&
            tiktokService.notifyFeed(tikTokSettings, args.BMHostDomain, path, args.FeedType, args.UpdateType) &&
            tiktokService.notifyFeed(tikTokSettings, args.BMHostDomain, path, args.FeedType, 'delete')) { 
                //no details found for last run
                return new Status(Status.OK, 'OK', successRespone);
        } else {
            var result = tiktokService.notifyFeed(tikTokSettings, args.BMHostDomain, path, args.FeedType, 'update');
            if(!result) {
                return new Status(Status.ERROR, 'ERROR', failedResponse);
            }
            if(latestRunDetails.deleteFileGenerated) {
                if (!tiktokService.notifyFeed(tikTokSettings, args.BMHostDomain, path, args.FeedType, 'delete')) {
                    return new Status(Status.ERROR, 'ERROR', failedResponse);
                }
            }
            return new Status(Status.OK, 'OK', successRespone);
        }
    } else {
        if (tiktokService.notifyFeed(tikTokSettings, args.BMHostDomain, path, args.FeedType, args.UpdateType)) {
            return new Status(Status.OK, 'OK', successRespone);
        }
    }

    return new Status(Status.ERROR, 'ERROR', failedResponse);
    
}

function getLatestProductFeedRunDetails(basePath, args) {
    var File = require('dw/io/File');
    var FileReader = require('dw/io/FileReader');
    var fileReader;
    var errorReturn = { 'error': true };
    var Logger = require('dw/system/Logger').getLogger('NotifyTikTok');
    var dir = new File(File.IMPEX + basePath + File.SEPARATOR + 'tracking' + File.SEPARATOR + require('dw/system/Site').getCurrent().ID);

    if(!dir.exists() && !dir.mkdirs()) {
        Logger.warn('Error in getting tracker file');
        return errorReturn;
    }
    var file = new File(dir, '.lastrun.txt');

    if (!file && !file.isFile()) {
        Logger.error('Error in getting tracker file');
        return errorReturn;
    }

    try {
        fileReader = new FileReader(file);
        var data = fileReader.readLine();
        if((typeof data === 'string' || data instanceof String) && data.length > 0) {
            return JSON.parse(data);
        } else {
            return errorReturn;
        }
    } catch(e) {
        Logger.error('Error while parsing the tracker file: ' + e);
        return errorReturn;
    } finally {
        if(fileReader) {
            fileReader.close();
        }
    }

    return errorReturn;
    
}