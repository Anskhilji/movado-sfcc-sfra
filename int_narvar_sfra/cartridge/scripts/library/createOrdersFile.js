'use strict';

const OrderMgr = require('dw/order/OrderMgr');
const File = require('dw/io/File');
const FileWriter = require('dw/io/FileWriter');
const Calendar = require('dw/util/Calendar');
const StringUtils = require('dw/util/StringUtils');

const util = require('../utils/util');
const transformer = require('../transformer/index');
const log = require('../utils/log');

/**
 * @constructor
 * @classdesc CreateOrdersFile class
 */
function CreateOrdersFile() {
    try {
        const failedAttemptsBeforeBatch = util.PREFERENCE_VALUE.FAILED_ATTEMPTS_BEFORE_BATCH;

        this.OrderCount = null;
        this.Orders = null;
        this.File = null;

        const queryString = 'custom.narvarApiCallFailedCount >= {0}';
        const ordersIterator = OrderMgr.queryOrders(queryString, null, failedAttemptsBeforeBatch);
        const ordersCount = ordersIterator.count;

        log.sendLog('info', 'CreateOrdersFile:CreateOrdersFile, started creating file with orders count:: ' + ordersCount);

        this.OrderCount = ordersCount;

        // Check if any order was found
        if (ordersCount === 0) {
            return '';
        }

        const orders = ordersIterator.asList();
        const ordersList = orders.toArray();
        this.Orders = ordersList;

        // Create file in temp folder for uploading via API
        const calendar = new Calendar();
        calendar.timeZone = 'GMT';
        const gmtDateString = StringUtils.formatCalendar(calendar, 'yyyyMMddHHmmss');
        const filename = 'orders_' + gmtDateString;
        const filePath = '/src/upload/narvar/';
        const fullFilePath = File.IMPEX + filePath + filename;
        new File(File.IMPEX + filePath).mkdirs();
        const file = new File(fullFilePath);
        file.createNewFile();

        /* Create an output stream */
        const fw = new FileWriter(file, 'UTF-8');

        log.sendLog('info', 'CreateOrdersFile:CreateOrdersFile, started writing orders to file:: ' + fullFilePath);

        ordersList.forEach(function (order) {
            try {
                const orderObj = transformer.getTransformedPayload(order);
                fw.write(JSON.stringify(orderObj));
                fw.write('\r\n');
            } catch (e) {
                const exception = e;
                log.error(exception);
            }
        });

        fw.close();
        log.sendLog('info', 'CreateOrdersFile:CreateOrdersFile, completed writing orders to file:: ' + fullFilePath);

        this.File = fullFilePath;
    } catch (e) {
        const exception = e;

        log.sendLog('error', 'CreateOrdersFile:CreateOrdersFile, error while creating order file:: ' + JSON.stringify(exception));
    }
    return '';
}

module.exports = CreateOrdersFile;
