var Logger = require('dw/system/Logger');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var FileWriter = require('dw/io/FileWriter');
var File = require('dw/io/File');
var StringUtils = require('dw/util/StringUtils');
var Status = require('dw/system/Status');
var System = require('dw/system/System');

/**
 * Orders export
 *
 * @param {array} options
 */

 function socialOrderExport(parameters) {
    if (parameters.containsKey("FileFolder") && parameters.containsKey("FileName")) {
        var timestamp = StringUtils.formatCalendar(new dw.util.Calendar(),  "yyyy-MM-dd'T'HH:mm:ss'Z'");
        var TIKTOK_IMPEX_FOLDER = File.IMPEX + File.SEPARATOR + parameters.get("FileFolder");
        var exportFile = TIKTOK_IMPEX_FOLDER + File.SEPARATOR + parameters.get("FileName")+ "_" + timestamp+".xml";
        var ordersIterator;
        var sortString = 'orderNo DESC';
        var queryString = "custom.externalExportStatus = {0}";

        // create directory if it doesn't exist
        var sourceDir = new File(TIKTOK_IMPEX_FOLDER);
        if (!sourceDir.exists() && !sourceDir.mkdirs()) {
            return new Status(Status.ERROR, 'ERROR', 'Error creating order export directory');
        }

        var file = new File(exportFile);
        var fileWriter = FileWriter(file, "UTF-8");
        try {
            fileWriter.writeLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            fileWriter.writeLine("<orders xmlns=\"http:\/\/www.demandware.com\/xml\/impex\/order\/2006-10-31\">");
            ordersIterator = OrderMgr.searchOrders(queryString, sortString, Order.EXPORT_STATUS_READY);
            while (ordersIterator.hasNext()) {
                var exportOrder = ordersIterator.next();
                var orderExportXML = exportOrder.getOrderExportXML();

                orderExportXML = orderExportXML.substring(orderExportXML.indexOf("order-no="));
                orderExportXML = "<order " + orderExportXML;
                fileWriter.write(orderExportXML);
                fileWriter.flush();
                exportOrder.custom.externalExportStatus =  Order.EXPORT_STATUS_EXPORTED;
            }
            fileWriter.writeLine("</orders>");

        } catch (e) {
            return new Status(Status.ERROR, 'ERROR', 'Failed to export the orders: ' + e);
        } finally {
            ordersIterator && ordersIterator.close();
            fileWriter.close();
        }
    }
    else {
        return new Status (Status.ERROR, 'ERROR', 'Failed to export the orders: missing required parameter');
    }

    var instanceHostname = System.getInstanceHostname();
    if (notifyTikTok(instanceHostname, exportFile)) {
        return new Status(Status.OK);
    }
    else {
        return new Status (Status.ERROR, 'ERROR', 'error notify TikTok. Filename = ' + instanceHostname);
    }
};


function notifyTikTok(SiteDownloadURL, exportFile) {
    var tiktokService = require('int_tiktok/cartridge/scripts/services/tiktokService');
    var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
    var tikTokSettings = customObjectHelper.getCustomObject();
    var webDavURL = "https:\/\/" + SiteDownloadURL + "\/on\/demandware.servlet\/webdav\/Sites\/" + exportFile;

    if (tiktokService.notifyFeed(tikTokSettings,SiteDownloadURL,webDavURL, "order","update")) {
        return true;
    }
    else {
       return false;
    }
}


function notifySnap(SiteDownloadURL, exportFile) {
    var snapChatService = require('int_snapchat/cartridge/scripts/services/snapchatService');
    var customObjectHelper = require('int_snapchat/cartridge/scripts/customObjectHelper');
    var snapChatSettings = customObjectHelper.getCustomObject();
    var webDavURL = "https:\/\/" + SiteDownloadURL + "\/on\/demandware.servlet\/webdav\/Sites\/" + exportFile;

    if (snapChatService.notifyFeed(snapChatSettings,SiteDownloadURL,webDavURL, "order","update")) {
        return true;
    }
    else {
       return false;
    }
}

exports.socialOrderExport = socialOrderExport;

