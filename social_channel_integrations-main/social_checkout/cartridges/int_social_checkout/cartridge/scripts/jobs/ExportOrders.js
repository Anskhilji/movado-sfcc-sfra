'use strict';

var Calendar = require('dw/util/Calendar');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var LineItemCtnr = require('dw/order/LineItemCtnr');
var Logger = require('dw/system/Logger');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');
var StringUtils = require('dw/util/StringUtils');
var System = require('dw/system/System');
var socialCheckoutHelpers = require('int_social_checkout/cartridge/scripts/util/socialCheckoutHelpers');

var SUPPORTED_NOTIFY_CHANNELS = [
    LineItemCtnr.CHANNEL_TYPE_SNAPCHAT,
    LineItemCtnr.CHANNEL_TYPE_TIKTOK
];

/**
 *  Notifies Social Channel about the order export.
 *  @param {number} channelType the channel type to notify
 * @param {string} exportFile The name of the export file
 * @returns {boolean} true/false
 */
function notify(channelType, exportFile) {
    try {
        var channelSvc = null;
        var customObjectHelper = null;

        switch (channelType) {
            case LineItemCtnr.CHANNEL_TYPE_TIKTOK:
                channelSvc = require('int_tiktok/cartridge/scripts/services/tiktokService');
                customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
                break;
            case LineItemCtnr.CHANNEL_TYPE_SNAPCHAT:
                channelSvc = require('int_snapchat/cartridge/scripts/services/snapchatService');
                customObjectHelper = require('int_snapchat/cartridge/scripts/customObjectHelper');
                break;
            default:
                channelSvc = null;
                customObjectHelper = null;
                break;
        }

        if (!channelSvc || !customObjectHelper) {
            return false;
        }

        var instanceHostname = System.getInstanceHostname();
        var channelSettings = customObjectHelper.getCustomObject();
        var webDavURL = 'https://' + instanceHostname + '/on/demandware.servlet/webdav/Sites/' + exportFile;

        if (channelSvc.notifyFeed(channelSettings, instanceHostname, webDavURL, 'order', 'update')) {
            return true;
        }
        return false;
    } catch (e) {
        Logger.error(e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
        return false;
    }
}

/**
 * Orders export
 * @param {Object} parameters job parameters
 * @returns {dw.system.Status} job status
 */
function socialOrderExport(parameters) {
    if (!parameters.containsKey('FileFolder') || !parameters.containsKey('FileName')) {
        return new Status(Status.ERROR, 'ERROR', 'Failed to export the orders: missing required parameters');
    }

    var timestamp = StringUtils.formatCalendar(new Calendar(), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    var impexFolder = File.IMPEX + File.SEPARATOR + parameters.get('FileFolder');

    // non-breaking change for existing TikTok customers
    var socialChannel = parameters.containsKey('SocialChannel') ? parameters.get('SocialChannel') : 'TikTok';
    var channelType = socialCheckoutHelpers.getChannelType(socialChannel);
    if (!channelType) {
        channelType = LineItemCtnr.CHANNEL_TYPE_TIKTOK;
    }

    var exportFile;
    var ordersIterator;
    var fileWriter;
    var sortString = 'orderNo DESC';
    var queryString = 'channelType = {0} AND custom.externalExportStatus = {1}';
    var ordersExportedCount = 0;

    // create directory if file does not exist
    var sourceDir = new File(impexFolder);
    if (!sourceDir.exists() && !sourceDir.mkdirs()) {
        return new Status(Status.ERROR, 'ERROR', 'Error creating order export directory');
    }

    try {
        ordersIterator = OrderMgr.searchOrders(queryString, sortString, channelType, Order.EXPORT_STATUS_READY);

        // always create empty files for TikTok
        var createFile = channelType === LineItemCtnr.CHANNEL_TYPE_TIKTOK ? true : ordersIterator.count > 0;

        if (createFile) {
            exportFile = impexFolder + File.SEPARATOR + parameters.get('FileName') + '_' + timestamp + '.xml';
            fileWriter = FileWriter(new File(exportFile), 'UTF-8');

            fileWriter.writeLine('<?xml version="1.0" encoding="UTF-8"?>');
            fileWriter.writeLine('<orders xmlns="http://www.demandware.com/xml/impex/order/2006-10-31">');

            while (ordersIterator.hasNext()) {
                var exportOrder = ordersIterator.next();
                ordersExportedCount++;
                var orderExportXML = exportOrder.getOrderExportXML();

                orderExportXML = orderExportXML.substring(orderExportXML.indexOf('order-no='));
                orderExportXML = '<order ' + orderExportXML;
                fileWriter.write(orderExportXML);
                exportOrder.custom.externalExportStatus = Order.EXPORT_STATUS_EXPORTED;
            }

            fileWriter.writeLine('</orders>');
        }
    } catch (e) {
        return new Status(Status.ERROR, 'ERROR', 'Failed to export the orders: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    } finally {
        if (ordersIterator) ordersIterator.close();
        if (fileWriter) {
            fileWriter.flush();
            fileWriter.close();
        }
    }

    if (ordersExportedCount > 0 && exportFile && channelType && SUPPORTED_NOTIFY_CHANNELS.indexOf(channelType) > -1) {
        if (notify(channelType, exportFile)) {
            return new Status(Status.OK);
        }
        return new Status(Status.ERROR, 'ERROR', 'error notifying ' + socialChannel + ' of order export.');
    }
    return new Status(Status.OK);
}

exports.socialOrderExport = socialOrderExport;
