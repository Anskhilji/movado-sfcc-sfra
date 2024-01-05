'use strict';

/**
 * get latest product export run details
 * @param {string} basePath - impex folder base path
 * @returns {{error: boolean}|any} result object
 */
function getLatestProductFeedRunDetails(basePath) {
    var File = require('dw/io/File');
    var FileReader = require('dw/io/FileReader');
    var fileReader;
    var errorReturn = { error: true };
    var Logger = require('dw/system/Logger').getLogger('NotifyTikTok');
    var dir = new File(File.IMPEX + basePath + File.SEPARATOR + 'tracking' + File.SEPARATOR + require('dw/system/Site').getCurrent().ID);

    if (!dir.exists() && !dir.mkdirs()) {
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
        if ((typeof data === 'string' || data instanceof String) && data.length > 0) {
            return JSON.parse(data);
        }
        return errorReturn;
    } catch (e) {
        Logger.error('Error while parsing the tracker file: ' + e);
        return errorReturn;
    } finally {
        if (fileReader) {
            fileReader.close();
        }
    }
}

/**
 * Sleeps for the specified number of milliseconds.
 * WARNING: This function should be used with care and
 * only when absolutely necessary to prevent thread pool exhaustion.
 *
 * the web service call to an invalid port should block on the request
 * and hopefully this block should prevent the CPU from running the process
 *
 * per Class HTTPClient.setTimeout documentation:
 * This timeout value controls both the "connection timeout"
 * (how long it takes to connect to the remote host)
 * and the "socket timeout" (how long, after connecting, it will wait without any data being read).
 * Therefore, in the worst case scenario, the total time of inactivity
 * could be twice as long as the specified value.
 * Because of this, the timeout is divided by 2 to ensure that the
 * total time we are sleeping is not longer than the specified value.
 * @param {number} ms - millisecond to wait
 */
function sleep(ms) {
    try {
        var HTTPClient = require('dw/net/HTTPClient');
        var System = require('dw/system/System');
        var httpClient = new HTTPClient();
        httpClient.setTimeout(ms / 2);
        httpClient.open('GET', 'https://' + System.getInstanceHostname() + ':9999/');
        httpClient.send();
    } catch (e) { /* ignore */ }
}

/**
 * Notifies TikTok about the successful feed generation via API call
 * @param {Array} args job arguments
 * @returns {dw.system.Status} Exit status for a job run
 */
exports.execute = function (args) {
    var Status = require('dw/system/Status');
    var System = require('dw/system/System');
    var tiktokService = require('int_tiktok/cartridge/scripts/services/tiktokService');
    var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
    var tikTokSettings = customObjectHelper.getCustomObject();
    var constants = require('../TikTokConstants');
    var WAIT_SECONDS = 30;
    var TIMEOUT = WAIT_SECONDS * 1000;
    var RESPONSES = {
        SUCCESS: 'Notified Successfully',
        FAILED: 'Notification Service Failed'
    };
    var svcResult;

    var instanceHostname = System.getInstanceHostname();
    var path = require('dw/util/StringUtils').format(
        '{0}://{1}{2}{3}',
        'https',
        instanceHostname,
        constants.IMPEX_DEFAULT_PATH,
        args.FileFolder || constants.FEED_PATHS[args.FeedType]
    );

    if (args.FeedType === 'product') {
        var updateType = 'update';
        var notifyDelete = true;

        var latestRunDetails = getLatestProductFeedRunDetails(args.FileFolder || constants.FEED_PATHS[args.FeedType], args);
        if (latestRunDetails && !latestRunDetails.error) {
            // updateType = latestRunDetails.deltaEnabled ? 'update' : 'create';
            notifyDelete = latestRunDetails.deleteFileGenerated;
        }

        // execute delete notify service call first
        if (notifyDelete) {
            svcResult = tiktokService.notifyFeed(tikTokSettings, instanceHostname, path, 'product', 'delete');
            if (!svcResult) {
                return new Status(Status.ERROR, 'ERROR', RESPONSES.FAILED);
            }
            // wait specified number of seconds
            sleep(TIMEOUT);
        }

        svcResult = tiktokService.notifyFeed(tikTokSettings, instanceHostname, path, 'product', updateType);
        if (!svcResult) {
            return new Status(Status.ERROR, 'ERROR', RESPONSES.FAILED);
        }

        return new Status(Status.OK, 'OK', RESPONSES.SUCCESS);
    }

    if (tiktokService.notifyFeed(tikTokSettings, instanceHostname, path, args.FeedType, args.UpdateType)) {
        return new Status(Status.OK, 'OK', RESPONSES.SUCCESS);
    }

    return new Status(Status.ERROR, 'ERROR', RESPONSES.FAILED);
};
