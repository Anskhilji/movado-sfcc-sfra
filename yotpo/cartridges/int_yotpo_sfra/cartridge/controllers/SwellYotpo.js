'use strict';

/**
 * @module controllers/SwellYotpo
 *
 * This is main controller for Swell Loyalty. It contains all endpoints which
 * Yotpo cartridge exposes to search customers, orders and process other data requests.
 */

var SwellAPI = require('/int_yotpo/cartridge/scripts/yotpo/swell/api/SwellAPI');
var YotpoLogger = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoLogger');

var server = require('server');

server.get('GetCustomer', server.middleware.https, function (req, res, next) {
    YotpoLogger.logMessage('Received request to fetch single customer',
            'debug', 'SwellYotpo~GetCustomer');

    var params = {
        apiKey: req.querystring.api_key,
        customerNo: req.querystring.id,
        email: req.querystring.email,
        singleCustomer: true
    };

    var result = SwellAPI.fetchCustomers(params);

    res.setStatusCode(result.status);
    res.json(result.responseJSON);

    next();
});

server.get('GetCustomers', server.middleware.https, function (req, res, next) {
    YotpoLogger.logMessage('Received request to fetch multiple customers',
            'debug', 'SwellYotpo~GetCustomers');

    var params = {
        apiKey: req.querystring.api_key,
        startIndex: req.querystring.page,
        pageSize: req.querystring.page_size,
        singleCustomer: false
    };

    var result = SwellAPI.fetchCustomers(params);

    res.setStatusCode(result.status);
    res.json(result.responseJSON);

    next();
});

server.get('GetOrderCountByState', server.middleware.https, function (req, res, next) {
    YotpoLogger.logMessage('Received request to fetch order by state',
            'debug', 'SwellYotpo~GetOrderCountByState');

    var params = {
        apiKey: req.querystring.api_key,
        state: req.querystring.state,
        orderCountByState: true
    };

    var result = SwellAPI.getOrdersCount(params);

    res.setStatusCode(result.status);
    res.json(result.responseJSON);

    next();
});

server.get('GetOrderCountByVolume', server.middleware.https, function (req, res, next) {
    YotpoLogger.logMessage('Received request to fetch order by volume',
            'debug', 'SwellYotpo~GetOrderCountByVolume');

    var params = {
        apiKey: req.querystring.api_key,
        orderCountByState: false
    };

    var result = SwellAPI.getOrdersCount(params);

    res.setStatusCode(result.status);
    res.json(result.responseJSON);

    next();
});

server.get('GetOrder', server.middleware.https, function (req, res, next) {
    YotpoLogger.logMessage('Received request to fetch order by id',
            'debug', 'SwellYotpo~GetOrder');

    var params = {
        apiKey: req.querystring.api_key,
        orderId: req.querystring.id,
        singleOrder: true
    };

    var result = SwellAPI.fetchOrders(params);

    res.setStatusCode(result.status);
    res.json(result.responseJSON);

    next();
});

server.get('GetOrders', server.middleware.https, function (req, res, next) {
    YotpoLogger.logMessage('Received request to fetch orders by page size, page counter and state',
            'debug', 'SwellYotpo~GetOrders');

    var params = {
        apiKey: req.querystring.api_key,
        page: req.querystring.page,
        pageSize: req.querystring.page_size,
        state: req.querystring.state,
        singleOrder: false
    };

    var result = SwellAPI.fetchOrders(params);

    res.setStatusCode(result.status);
    res.json(result.responseJSON);

    next();
});

server.post('CreateGiftCertificate', server.middleware.https, function (req, res, next) {
    YotpoLogger.logMessage('Received request to create gift certificate',
            'debug', 'SwellYotpo~CreateGiftCertificate');

    var params = {
        apiKey: req.querystring.api_key,
        amount: req.querystring.amount,
        code: req.querystring.code,
        senderName: req.querystring.sender_name,
        recipientName: req.querystring.recipient_name,
        recipientEmail: req.querystring.recipient_email,
        description: req.querystring.description,
        message: req.querystring.message
    };

    var result = SwellAPI.createGiftCertificate(params);

    res.setStatusCode(result.status);
    res.json(result.responseJSON);

    next();
});

module.exports = server.exports();
