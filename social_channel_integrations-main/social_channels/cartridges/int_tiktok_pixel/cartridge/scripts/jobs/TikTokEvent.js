'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');

/**
 * Send grouped events to TikTok
 * @param {Object} args The argument object for the job
 * @returns {boolean} - returns execute result
 */
function batchTikTokGroups(args) {
    var totalEvents = 0;
    var bundlesIter;

    try {
        var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
        var tiktokService = require('int_tiktok/cartridge/scripts/services/tiktokService');
        var tikTokSettings = customObjectHelper.getCustomObject();
        var svcResponse;
        var numRuns = args.runs;

        bundlesIter = CustomObjectMgr.queryCustomObjects('TikTokWebEventsBundle', '', 'creationDate asc', null);

        if (!bundlesIter.hasNext()) {
            Logger.info('No events to send');
            bundlesIter.close();
            return new Status(Status.OK);
        }

        for (var i = 0; i < numRuns && bundlesIter.hasNext(); i++) {
            var currentBundle = bundlesIter.next();
            var dataToSend = JSON.parse(currentBundle.custom.EventList);

            svcResponse = tiktokService.batchPixelTrack(tikTokSettings, dataToSend);

            if (svcResponse) {
                customObjectHelper.removeCustomObject(currentBundle);
                totalEvents += dataToSend.length;
                Logger.info('Group: ' + (i + 1) + ', events : ' + dataToSend.length);
            } else {
                var eventTimestamp = currentBundle.custom.EventTimestamp;
                Logger.info('Batch API Service call failed on TikTokWebEventBundle custom object with timestamp: ' + eventTimestamp);
            }
        }
    } catch (e) {
        Logger.error('batchTikTokGroups job error: ' + e.message);
        bundlesIter.close();
        return new Status(Status.ERROR, null, e.message);
    }

    Logger.info('Total events sent = ' + totalEvents);
    bundlesIter.close();
    return new Status(Status.OK);
}

/**
 * Group several TikTok web events and convert them into a new unique custom object
 * @param {Object} args The argument object for the job
 * @returns {boolean} - returns execute result
 */
function groupTikTokEvents(args) {
    try {
        var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');

        var keyAttributeIdx = 0;
        var nextEvents = customObjectHelper.getTikTokEventsByGroupSize(args.groupSize);

        while (nextEvents.length > 0) {
            var tikTokEvents = nextEvents.map(function (e) {
                return customObjectHelper.getTreatedEvent(e);
            });

            // eslint-disable-next-line
            Transaction.wrap(function () {
                customObjectHelper.createNewTikTokWebEventsBundle(tikTokEvents, customObjectHelper.timestamp() + keyAttributeIdx++);
                for (var i = 0; i < nextEvents.length; i++) {
                    CustomObjectMgr.remove(nextEvents[i]);
                }
            });

            nextEvents = customObjectHelper.getTikTokEventsByGroupSize(args.groupSize);
        }
    } catch (e) {
        Logger.error('Update order status Job error: ' + e.message);
        return new Status(Status.ERROR, null, e.message);
    }

    return new Status(Status.OK);
}

exports.groupTikTokEvents = groupTikTokEvents;
exports.batchTikTokGroups = batchTikTokGroups;
