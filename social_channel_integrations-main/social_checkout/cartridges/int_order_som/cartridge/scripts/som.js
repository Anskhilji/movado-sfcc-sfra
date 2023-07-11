'use strict';

var ServiceMgr = require('~/cartridge/scripts/services/somServiceMgr');
var somPreferences = require('~/cartridge/config/somPreferences');
var Order = require('dw/order/Order');
var Logger = require('dw/system/Logger');
var collections = require('app_storefront_base/cartridge/scripts/util/collections');

/**
 * Creates the SOM query to get the OrderItemSummaries
 * @returns {string} api query.
 */
function getOrderItemSummariesQuery() {
    var orderItemSummariesQuery;

    if (somPreferences.orderHistoryQuery && somPreferences.orderHistoryQuery.orderItemSummaries) {
        orderItemSummariesQuery = somPreferences.orderHistoryQuery.orderItemSummaries;
    } else {
        orderItemSummariesQuery = 'SELECT+OrderItemSummary.Id,' +
                                        'OrderItemSummary.ProductCode,' +
                                        'OrderItemSummary.Description,' +
                                        'OrderItemSummary.OrderDeliveryGroupSummaryId,' +
                                        'OrderItemSummary.Quantity,' +
                                        'OrderItemSummary.QuantityAvailableToFulfill,' +
                                        'OrderItemSummary.QuantityAvailableToCancel,' +
                                        'OrderItemSummary.QuantityAvailableToReturn,' +
                                        'OrderItemSummary.QuantityOrdered,' +
                                        'OrderItemSummary.QuantityCanceled,' +
                                        'OrderItemSummary.QuantityReturned,' +
                                        'OrderItemSummary.TotalPrice,' +
                                        'OrderItemSummary.UnitPrice,' +
                                        'OrderItemSummary.TotalTaxAmount,' +
                                        'OrderItemSummary.Type,' +
                                        'OrderItemSummary.TypeCode+' +
                                    'FROM+OrderItemSummaries';
    }

    return orderItemSummariesQuery;
}

/**
 * Creates the SOM query to get the OrderDeliveryGroupSummaries
 * @returns {string} api query.
 */
function getOrderDeliveryGroupSummariesQuery() {
    var orderDeliveryGroupSummariesQuery;

    if (somPreferences.orderHistoryQuery && somPreferences.orderHistoryQuery.orderDeliveryGroupSummaries) {
        orderDeliveryGroupSummariesQuery = somPreferences.orderHistoryQuery.orderDeliveryGroupSummaries;
    } else {
        orderDeliveryGroupSummariesQuery = 'SELECT+OrderDeliveryGroupSummary.id,+' +
                                                  'OrderDeliveryGroupSummary.DeliverToName,+' +
                                                  'OrderDeliveryGroupSummary.DeliverToAddress,' +
                                                  'OrderDeliveryGroupSummary.OrderDeliveryMethodId+' +
                                                  'OrderDeliveryGroupSummary.PhoneNumber+' +
                                                  'OrderDeliveryGroupSummary.EmailAddress+' +
                                            'FROM+OrderDeliveryGroupSummaries';
    }
    return orderDeliveryGroupSummariesQuery;
}

/**
 * Creates the SOM query to get the OrderDeliveryGroupSummaries
 * @returns {string} api query.
 */
function getOrderPaymentSummariesQuery() {
    var orderPaymentSummariesQuery;

    if (somPreferences.orderHistoryQuery && somPreferences.orderHistoryQuery.orderPaymentSummariesQuery) {
        orderPaymentSummariesQuery = somPreferences.orderHistoryQuery.orderPaymentSummariesQuery;
    } else {
        orderPaymentSummariesQuery = 'SELECT+' +
            'OrderPaymentSummary.PaymentMethodId,+' +
            'OrderPaymentSummary.FullName,+' +
            'OrderPaymentSummary.Method+' +
            'FROM+OrderPaymentSummaries';
    }

    return orderPaymentSummariesQuery;
}
/**
 * Creates the SOM query to get the order history, if there is an error this function will return null
 * @param {array} orderNumbers - order numbers.
 * @param {string} orderSummaryId - SOM order summary ID
 * @param {Object} filters - filters to apply to the query.
 * @returns {string} api query.
 */
function getOrderSummaryQuery(orderNumbers, orderSummaryId, filters) {
    var query = '';
    var select = '';
    var from = '';
    var where = '';
    var orderBy = '';
    var filtersObj = filters || {};

    var orderItemSummaries = getOrderItemSummariesQuery();
    var orderDeliveryGroupSummaries = getOrderDeliveryGroupSummariesQuery();
    var orderPaymentSummaries = getOrderPaymentSummariesQuery();

    select = 'SELECT+Id,+' +
                    'AccountId,+' +
                    'OrderNumber,+' +
                    'OrderedDate,+' +
                    'Status,+' +
                    'BillingAddress,+' +
                    'BillingPhoneNumber,+' +
                    'BillingEmailAddress,+' +
                    'GrandTotalAmount,+' +
                    'TotalAmount,+' +
                    'TotalTaxAmount,+' +
                    'TotalAdjustedDeliveryAmount,+' +
                    'TotalAdjustedProductAmount,+' +
                    'TotalDeliveryAdjDistAmount,+' +
                    'TotalProductAdjDistAmount,+' +
                    '(' + orderPaymentSummaries + '),+' +
                    '(' + orderItemSummaries + '),+' +
                    '(' + orderDeliveryGroupSummaries + ')';

    from = 'FROM+OrderSummary';

    if (orderNumbers) {
        var ordersStr = '';
        if (orderNumbers && typeof orderNumbers === 'object') {
            // if there is an array of order id's
            orderNumbers.forEach(function (orderNo) {
                ordersStr += "'" + orderNo + "'";
                if (orderNumbers.length > 1 && orderNo !== orderNumbers[orderNumbers.length - 1]) {
                    ordersStr += ',';
                }
            });
        }

        where = 'WHERE+OrderNumber+IN+(+' + ordersStr + '+)';
    } else {
        where = "WHERE+Id+=+'" + orderSummaryId + "'";
    }

    orderBy = 'ORDER+BY+OrderedDate+DESC+NULLS+LAST';

    if ('fromDate' in filtersObj) {
        where += '+AND+OrderedDate+>+' + filtersObj.fromDate;
    }

    if ('toDate' in filtersObj) {
        where += '+AND+OrderedDate+<+' + filtersObj.toDate;
    }

    if ('year' in filtersObj) {
        where += '+AND+CALENDAR_YEAR(OrderedDate)+=+' + filtersObj.year;
    }

    if (Object.keys(filtersObj).length === 0) {
        where += '+AND+OrderedDate+<>+NULL';
    }

    if (where.length <= 4000) {
        query = select + '+' + from + '+' + where + '+' + orderBy;
        return query;
    } else if (where.length > 4000) {
        Logger.error('Where clause has exceeded length limit of 4000 characters');
        return null;
    }
    return null;
}

/**
 * Creates the SOM query to get the FulfillmentOrderLineItem
 * @returns {string} api query.
 */
function getFulfillmentOrderLineItemsQuery() {
    var fulfillmentOrderLineItemsQuery;

    if (somPreferences.orderHistoryQuery && somPreferences.orderHistoryQuery.fulfillmentOrderLineItems) {
        fulfillmentOrderLineItemsQuery = somPreferences.orderHistoryQuery.fulfillmentOrderLineItems;
    } else {
        fulfillmentOrderLineItemsQuery = 'SELECT+FulfillmentOrderLineItem.Id,' +
                                                'FulfillmentOrderLineItem.OrderItemSummaryId,' +
                                                'FulfillmentOrderLineItem.Quantity,' +
                                                'FulfillmentOrderLineItem.TotalPrice,' +
                                                'FulfillmentOrderLineItem.TotalTaxAmount+' +
                                        'FROM+FulfillmentOrderLineItems+' +
                                        "WHERE+FulfillmentOrderLineItem.TypeCode='Product'";
    }

    return fulfillmentOrderLineItemsQuery;
}

/**
 * Creates the SOM query to get the FulfillmentOrderShipments
 * @param {string} fulfillmentIdRef - a ID referencing the result for workaround.
 * @returns {string} api query.
 */
function getOrderShipmentsQuery(fulfillmentIdRef) {
    var orderShipmentsQuery;
    if (somPreferences.orderHistoryQuery && somPreferences.orderHistoryQuery.fulfillmentOrderShipments) {
        orderShipmentsQuery = somPreferences.orderHistoryQuery.fulfillmentOrderShipments;
    } else {
        orderShipmentsQuery = 'SELECT+' +
                                'Shipment.FulfillmentOrderId,' +
                                'Shipment.Id,' +
                                'Shipment.CreatedDate,' +
                                'Shipment.ShipToName,' +
                                'Shipment.Status,' +
                                'Shipment.TrackingNumber+';

        if (fulfillmentIdRef) {
            orderShipmentsQuery += 'FROM+Shipment+';
            orderShipmentsQuery += "WHERE+Shipment.FulfillmentOrderId='" + fulfillmentIdRef + "'";
        } else {
            orderShipmentsQuery += 'FROM+FulfillmentOrderShipments';
        }
    }
    return orderShipmentsQuery;
}

/**
 * Creates the SOM query to get the FulfillmentOrderShipments
 * @param {string} accounIdRef - a ID referencing the result.
 * @returns {string} api query.
 */
function getAccountQuery(accounIdRef) {
    var accountQuery;
    if (somPreferences.orderHistoryQuery && somPreferences.orderHistoryQuery.accountQuery) {
        accountQuery = somPreferences.orderHistoryQuery.accountQuery;
    } else {
        accountQuery = 'SELECT+' +
                            'FirstName,' +
                            'LastName,' +
                            'PersonEmail,' +
                            'BillingAddress,' +
                            'BillingCity,' +
                            'BillingCountry,' +
                            'BillingPostalCode,' +
                            'BillingState,' +
                            'BillingStreet,' +
                            'Phone+' +
                        'FROM+Account';
        if (accounIdRef) {
            accountQuery += "+WHERE+Id+=+'" + accounIdRef + "'";
        }
    }
    return accountQuery;
}

/**
 * Creates the SOM query to get the fulfillment information from SOM FulfillmentOrder.
 * @param {string} orderSummaryIdRef - a ID referencing the result of the OrderSummary query.
 * @param {string} ordersummariesIDsStr - SOM order IDs
 * @param {string} fulfillmentId - SOM fulfillment ID
 * @returns {string} api query.
 */
function getFulfillmentQuery(orderSummaryIdRef, ordersummariesIDsStr, fulfillmentId) {
    var query;
    var select;
    var from;
    var where;

    var fulfillmentOrderLineItems = getFulfillmentOrderLineItemsQuery();
    var orderShipments = getOrderShipmentsQuery();

    select = 'SELECT+' +
        'FulfillmentOrder.OrderSummaryId,' +
        'FulfillmentOrder.id,' +
        'FulfillmentOrder.DeliveryMethodId,' +
        'FulfillmentOrder.CreatedDate,' +
        'FulfillmentOrder.ItemCount,' +
        'FulfillmentOrder.Status,' +
        'FulfillmentOrder.StatusCategory,' +
        'FulfillmentOrder.FulfilledToAddress,' +
        'FulfillmentOrder.TotalAmount,' +
        'FulfillmentOrder.TotalTaxAmount,' +
        '(' + fulfillmentOrderLineItems + ')';

    select +=
        ',(' + orderShipments + ')';


    from = 'FROM+FulfillmentOrder';

    where = '';

    if (orderSummaryIdRef) {
        where = "WHERE+FulfillmentOrder.OrderSummaryId+=+'" + orderSummaryIdRef + "'";
    } else if (ordersummariesIDsStr) {
        where = 'WHERE+FulfillmentOrder.OrderSummaryId+in+(' + ordersummariesIDsStr + ')';
    } else {
        where = "WHERE+FulfillmentOrder.Id+=+'" + fulfillmentId + "'";
    }
    where += " AND FulfillmentOrder.Status != 'Cancelled'";

    query = select + '+' + from + '+' + where;

    return query;
}

/**
 * Creates the SOM query to get the FulfillmentOrderLineItem
 * @param {string} ref - a ID referencing the result of the OrderSummary query.
 * @returns {string} api query.
 */
function getPaymentMethodQuery(ref) {
    var query;
    var select;
    var from;
    var where;

    select = 'SELECT+' +
                'CardPaymentMethod.Id,' +
                'CardPaymentMethod.DisplayCardNumber,' +
                'CardPaymentMethod.CardHolderName,' +
                'CardPaymentMethod.ExpiryMonth,' +
                'CardPaymentMethod.ExpiryYear,' +
                'CardPaymentMethod.CardCategory,' +
                'CardPaymentMethod.CardType,' +
                'CardPaymentMethod.CardTypeCategory';
    from = 'FROM+CardPaymentMethod';
    where = '';
    if (ref) {
        where = "+ WHERE+CardPaymentMethod.Id+=+'" + ref + "'";
    }
    query = select + '+' + from + where;
    return query;
}

/**
 * Creates the SOM query to get the FulfillmentOrderLineItem
 * @param {string} ref - a ID referencing the result of the OrderSummary query.
 * @returns {string} api query.
 */
function getDeliveryMethodQuery(ref) {
    var query;
    var select;
    var from;
    var where;

    select = 'SELECT+Id,Name,Description,ProductId,ReferenceNumber';
    from = 'FROM+OrderDeliveryMethod';
    where = "WHERE+OrderDeliveryMethod.Id+=+'" + ref + "'";

    query = select + '+' + from + '+' + where;
    return query;
}


/**
 * Forms a query to get orderSummaries and fulfillments from SOM
 * @param {dw.util.SeekableIterator} customerOrders - orders connected to current customer
 * @param {Object} filters - filter object
 * @returns {string} query string.
 */
function getOrdersWithOneRequest(customerOrders, filters) {
    var apiResponse;
    var orders = collections.map(customerOrders, function (customerOrder) { return customerOrder.orderNo; });
    var svc = ServiceMgr.restComposite();
    var query = getOrderSummaryQuery(orders, null, filters);
    if (query && query.length && query.length < 100000) {
        var payload;
        var fulfillmentQuery;
        payload = {
            compositeRequest: [{
                method: 'GET',
                url: ServiceMgr.restEndpoints.query + '/?q=' + query,
                referenceId: 'refOrderSummaries'
            }]
        };
        // build the composite queries for fulfillments
        for (var i = 0; i < orders.length; i++) {
            fulfillmentQuery = getFulfillmentQuery('@{refOrderSummaries.records[' + i + '].Id}', null);
            if (fulfillmentQuery && fulfillmentQuery.length > 0 && fulfillmentQuery.length < 100000) {
                payload.compositeRequest.push({
                    method: 'GET',
                    url: ServiceMgr.restEndpoints.query + '/?q=' + fulfillmentQuery,
                    referenceId: 'refFulfillmentOrders' + i
                });
            } else if (fulfillmentQuery && fulfillmentQuery.length > 100000) {
                Logger.error('Fulfillment has exceeded length limit of 100000 characters');
            }
        }
        var req = JSON.stringify(payload);
        apiResponse = svc.call(req);
        if (!apiResponse || !apiResponse.ok) {
            Logger.error('Error getting orders and fulfillments.');
        }
    } else if (query && query.length > 100000) {
        Logger.error('Query has exceeded length limit of 100000 characters');
    }

    return apiResponse;
}

/**
 * make Payload For Order Item Summary Change
 * @param {Object} data - ordered items data
 * @param {boolean} shippingReductionFlag - shipping Reduction Flag
 * @returns {string} - response from SOM query
 */
function makePayloadForOrderItemSummaryChange(data, shippingReductionFlag) {
    var orderItems = data.lineItems;
    var payload = {
        inputs:
        [
            {
                orderSummaryId: data.summaryId,
                orderItemSummaryLineItemsToChangeInput: {
                    changeItems: []
                }
            }
        ]
    };
    for (var i = 0; i < orderItems.length; i++) {
        payload.inputs[0].orderItemSummaryLineItemsToChangeInput.changeItems.push({
            orderItemSummaryId: orderItems[i].id,
            quantity: orderItems[i].quantity,
            reason: orderItems[i].reason,
            shippingReductionFlag: shippingReductionFlag || false
        });
    }
    return payload;
}

/**
 * Gets the expected financial value for the proposed cancel action
 * and verifies that the action is eligible for the selected products.
 * @param {Object} cancelData - data for cancel ordered items
 * @returns {string} - response from SOM query
 */
function preCancelOrderItems(cancelData) {
    var apiResponse;
    var svc = ServiceMgr.restApi(somPreferences.somApiEndpoints.preCancelation);
    var payload = makePayloadForOrderItemSummaryChange(cancelData, somPreferences.cancelShippingReductionFlag);

    var req = JSON.stringify(payload);
    apiResponse = svc.call(req);
    return apiResponse;
}

/**
 * Change ordered items to cancel status, and a set of its financial values.
 * @param {Object} cancelData - data for cancel ordered items
 * @returns {string} - response from SOM query
 */
function cancelOrderItems(cancelData) {
    var apiResponse;
    var svc = ServiceMgr.restApi(somPreferences.somApiEndpoints.submitCancel);
    var payload = makePayloadForOrderItemSummaryChange(cancelData, somPreferences.cancelShippingReductionFlag);

    var req = JSON.stringify(payload);
    apiResponse = svc.call(req);
    return apiResponse;
}

/**
 * Gets the expected financial value for the proposed cancel action
 * and verifies that the action is eligible for the selected products.
 * @param {Object} returnData - data for return ordered items
 * @returns {string} - response from SOM query
 */
function preReturnOrderItems(returnData) {
    var apiResponse;
    var svc = ServiceMgr.restApi(somPreferences.somApiEndpoints.preReturn);
    var payload = makePayloadForOrderItemSummaryChange(returnData, somPreferences.returnShippingReductionFlag);

    var req = JSON.stringify(payload);
    apiResponse = svc.call(req);
    return apiResponse;
}

/**
 * Change ordered items to return status, and a set of its financial values.
 * @param {Object} returnData - data for return ordered items
 * @returns {string} - response from SOM query
 */
function returnOrderItems(returnData) {
    var apiResponse;
    var svc = ServiceMgr.restApi(somPreferences.somApiEndpoints.submitReturn);
    var payload = makePayloadForOrderItemSummaryChange(returnData, somPreferences.returnShippingReductionFlag);

    var req = JSON.stringify(payload);
    apiResponse = svc.call(req);
    return apiResponse;
}

/**
 * Performs two queries to get orders summaries then fulfillments from SOM
 * @param {dw.util.SeekableIterator} customerOrders - orders connected to current customer
 * @param {Object} filters - filter Obj
 * @returns {Object} with two properties apiResponseOrdersummaries & apiResponseFulfillments.
 */
function getOrdersWithTwoRequests(customerOrders, filters) {
    var apiResponseOrdersummaries;
    var apiResponseFulfillments;
    var orders = collections.map(customerOrders, function (customerOrder) { return customerOrder.orderNo; });
    var query = getOrderSummaryQuery(orders, null, filters);

    if (query && query.length && query.length < 100000) {
        var svc = ServiceMgr.restComposite();
        var svcfulfillment = ServiceMgr.restComposite();
        var orderSummariespayload = {
            compositeRequest: [{
                method: 'GET',
                url: ServiceMgr.restEndpoints.query + '/?q=' + query,
                referenceId: 'refOrderSummaries'
            }]
        };
        var req = JSON.stringify(orderSummariespayload);
        Logger.info("getOrdersWithTwoRequests Service:" + svc);
        Logger.info("getOrdersWithTwoRequests Request:" + req);
        apiResponseOrdersummaries = svc.call(req);
        if (apiResponseOrdersummaries.ok) {
            var ordersummaries = apiResponseOrdersummaries.object.responseObj.compositeResponse[0].body.records;
            if (ordersummaries) {
                var orderSummariesArray = ordersummaries.map(function (orderSummary) { return orderSummary.Id; });
                // form a string order id's for the second query to get fulfillments
                var orderSummariesIDsStr = '';
                for (var i = 0; i < orderSummariesArray.length; i++) {
                    orderSummariesIDsStr += "'" + orderSummariesArray[i] + "'";
                    if (i < orderSummariesArray.length - 1) {
                        orderSummariesIDsStr += ',';
                    }
                }
                var fulFillmentsQuery = getFulfillmentQuery(null, orderSummariesIDsStr);
                var fulfillmentpayload = {
                    compositeRequest: [{
                        method: 'GET',
                        url: ServiceMgr.restEndpoints.query + '/?q=' + fulFillmentsQuery,
                        referenceId: 'refFulfillments'
                    }]
                };
                req = JSON.stringify(fulfillmentpayload);
                apiResponseFulfillments = svcfulfillment.call(req);
                if (!apiResponseFulfillments.ok) {
                    Logger.error('Error getting fulfillments.');
                }
            } else {
                Logger.error('Error getting Order Summaries.');
            }
        } else {
            Logger.error('Error getting Order Summaries.');
        }
    } else if (query && query.length > 100000) {
        Logger.error('Query has exceeded length limit of 100000 characters');
    }
    return {
        apiResponseOrdersummaries: apiResponseOrdersummaries,
        apiResponseFulfillments: apiResponseFulfillments
    };
}

/**
 * Return an object containing response from SOM for orders and fulfillments by customer
 * @param {dw.customer.Customer} customer - current customer number
 * @param {Object} filters - filters object
 * @returns {Object} apiResponse - response from SOM query
 */
function getOrders(customer, filters) {
    // NOTE: currently we are using an existing orderID from within
    // digital to fill out the SOQL query string
    var orderHistory = customer.getOrderHistory();
    var customerOrders = orderHistory.getOrders(
        'status!={0}',
        'creationDate desc',
        Order.ORDER_STATUS_REPLACED
    );

    var apiResponse;
    var numberOfOrders = customerOrders.getCount();

    if (numberOfOrders > 0 && numberOfOrders <= 4) {
        // will make one request to SOM
        apiResponse = getOrdersWithOneRequest(customerOrders, filters);
        var compositeResponse = [];
        if (apiResponse && apiResponse.ok) {
            if (apiResponse.object.responseObj.compositeResponse) {
                for (var k = 0; k < apiResponse.object.responseObj.compositeResponse.length; k++) {
                    if (apiResponse.object.responseObj.compositeResponse[k].httpStatusCode === 200) {
                        compositeResponse.push(apiResponse.object.responseObj.compositeResponse[k]);
                    }
                }
                apiResponse.object.responseObj.compositeResponse = compositeResponse;
            }

            if (apiResponse.object.responseObj.compositeResponse[0].body.totalSize && apiResponse.object.responseObj.compositeResponse.length > 2) {
                // combines the results from queries to produce an apiResponse that is uniform for mapping fulfillments and order summaries
                for (var i = 2; i < apiResponse.object.responseObj.compositeResponse.length; i++) {
                    var fulfillments = apiResponse.object.responseObj.compositeResponse[i].body.records;
                    for (var j = 0; j < fulfillments.length; j++) {
                        apiResponse.object.responseObj.compositeResponse[1].body.records.push(fulfillments[j]);
                    }
                }
            }
        } else {
            Logger.error('Problem getting orders from SOM.');
        }
    } else if (numberOfOrders > 4) {
        // will make two requests to SOM
        var apiResponseObject = getOrdersWithTwoRequests(customerOrders, filters);
        if (apiResponseObject && apiResponseObject.apiResponseOrdersummaries && apiResponseObject.apiResponseFulfillments) {
            apiResponse = apiResponseObject.apiResponseOrdersummaries;
            // combines the results from queries to produce an apiResponse that is uniform for mapping fulfillments and order summaries
            apiResponse.object.responseObj.compositeResponse.push(apiResponseObject.apiResponseFulfillments.object.responseObj.compositeResponse[0]);
        } else {
            Logger.error('Problem getting both orders and fulfillments.');
        }
    }

    return apiResponse;
}

/**
 * Return an object containing response from SOM for orders and fulfillments by orderNumbers
 * @param {array} orderNumbers - order numbers
 * @returns {OrderSummary} order summary instance.
 */
function getOrdersSummary(orderNumbers) {
    var fulfillmentQuery;
    var paymentMethodQuery;
    var deliveryMethodQuery;
    var accountQuery;
    var apiResponse;
    var payload;
    var svc = ServiceMgr.restComposite();
    var query = getOrderSummaryQuery(orderNumbers, null, null);

    if (query && query.length && query.length < 100000) {
        var orderSummaryIdRef = '@{refOrderSummaries.records[0].Id}';
        var accountIdRef = '@{refOrderSummaries.records[0].AccountId}';
        var orderPaymentMethodRef = '@{refOrderSummaries.records[0].OrderPaymentSummaries.records[0].PaymentMethodId}';
        var orderDeliveryMethodRef = '@{refOrderSummaries.records[0].OrderDeliveryGroupSummaries.records[0].OrderDeliveryMethodId}';

        fulfillmentQuery = getFulfillmentQuery(orderSummaryIdRef, null);
        paymentMethodQuery = getPaymentMethodQuery(orderPaymentMethodRef);
        deliveryMethodQuery = getDeliveryMethodQuery(orderDeliveryMethodRef);
        accountQuery = getAccountQuery(accountIdRef);

        if (fulfillmentQuery && fulfillmentQuery.length > 0 && fulfillmentQuery.length < 100000) {
            payload = {
                compositeRequest: [{
                    method: 'GET',
                    url: ServiceMgr.restEndpoints.query + '/?q=' + query,
                    referenceId: 'refOrderSummaries'
                }, {
                    method: 'GET',
                    url: ServiceMgr.restEndpoints.query + '/?q=' + fulfillmentQuery,
                    referenceId: 'refFulfillmentOrders0'
                }, {
                    method: 'GET',
                    url: ServiceMgr.restEndpoints.query + '/?q=' + paymentMethodQuery,
                    referenceId: 'paymentMethod'
                }, {
                    method: 'GET',
                    url: ServiceMgr.restEndpoints.query + '/?q=' + accountQuery,
                    referenceId: 'account'
                }, {
                    method: 'GET',
                    url: ServiceMgr.restEndpoints.query + '/?q=' + deliveryMethodQuery,
                    referenceId: 'deliveryMethod'
                }, { // for workaround
                    method: 'GET',
                    url: ServiceMgr.restEndpoints.query + '/?q=' + getOrderShipmentsQuery('@{refFulfillmentOrders0.records[0].Id}'),
                    referenceId: 'shipment'
                }]
            };
            var req = JSON.stringify(payload);
            apiResponse = svc.call(req);
        } else if (fulfillmentQuery && fulfillmentQuery.length > 100000) {
            Logger.error('Fulfillment has exceeded length limit of 100000 characters');
        }
    } else if (query && query.length > 100000) {
        Logger.error('Query has exceeded length limit of 100000 characters');
    }

    return apiResponse;
}

/**
 * Return an object containing response from SOM for the specified order and fulfillment
 * In the case of an error this function returns undefined
 * @param {string} orderSummaryId - SOM orderSummaryId
 * @param {string} fulfillmentId - SOM fulfillmentId
 * @returns {Object} apiResponse - response from SOM query
 */
function getOrderAndFulfillment(orderSummaryId, fulfillmentId) {
    var svc = ServiceMgr.restComposite();
    var apiResponse;
    var orderSummaryQuery = getOrderSummaryQuery(null, orderSummaryId, null);

    if (orderSummaryQuery && orderSummaryQuery.length && orderSummaryQuery.length < 100000) {
        var orderSummaryIdRef = '@{refOrderSummaries.records[0].Id}';
        var accountIdRef = '@{refOrderSummaries.records[0].AccountId}';
        var orderPaymentMethodRef = '@{refOrderSummaries.records[0].OrderPaymentSummaries.records[0].PaymentMethodId}';
        var orderDeliveryMethodRef = '@{refOrderSummaries.records[0].OrderDeliveryGroupSummaries.records[0].OrderDeliveryMethodId}';
        var fulfillmentQuery;
        var paymentMethodQuery;
        var deliveryMethodQuery;
        var accountQuery;

        if (fulfillmentId) {
            fulfillmentQuery = getFulfillmentQuery(null, null, fulfillmentId);
        } else {
            fulfillmentQuery = getFulfillmentQuery(orderSummaryIdRef);
        }

        paymentMethodQuery = getPaymentMethodQuery(orderPaymentMethodRef);
        accountQuery = getAccountQuery(accountIdRef);
        deliveryMethodQuery = getDeliveryMethodQuery(orderDeliveryMethodRef);

        if (fulfillmentQuery && fulfillmentQuery.length > 0 && fulfillmentQuery.length < 100000) {
            var payload = {
                compositeRequest: [{
                    method: 'GET',
                    url: ServiceMgr.restEndpoints.query + '/?q=' + orderSummaryQuery,
                    referenceId: 'refOrderSummaries'
                }, {
                    method: 'GET',
                    url: ServiceMgr.restEndpoints.query + '/?q=' + fulfillmentQuery,
                    referenceId: 'refFulfillmentOrders0'
                }, {
                    method: 'GET',
                    url: ServiceMgr.restEndpoints.query + '/?q=' + paymentMethodQuery,
                    referenceId: 'paymentMethod'
                }, {
                    method: 'GET',
                    url: ServiceMgr.restEndpoints.query + '/?q=' + accountQuery,
                    referenceId: 'account'
                }, {
                    method: 'GET',
                    url: ServiceMgr.restEndpoints.query + '/?q=' + deliveryMethodQuery,
                    referenceId: 'deliveryMethod'
                },
                { // for workaround
                    method: 'GET',
                    url: ServiceMgr.restEndpoints.query + '/?q=' + getOrderShipmentsQuery('@{refFulfillmentOrders0.records[0].Id}'),
                    referenceId: 'shipment'
                }]
            };
            var req = JSON.stringify(payload);
            apiResponse = svc.call(req);
        } else if (fulfillmentQuery && fulfillmentQuery.length > 100000) {
            Logger.error('fulfillmentQuery in getOrderAndFulfillment has exceeded length limit of 100000 characters');
        }
    } else if (orderSummaryQuery && orderSummaryQuery.length > 100000) {
        Logger.error('orderSummaryQuery in getOrderAndFulfillment has exceeded length limit of 100000 characters');
    }
    return apiResponse;
}

/**
 * Return customer most recent order, in the case of an error this function can return undefined
 * @param {dw.customer.Customer} customer - current customer number
 * @returns {OrderSummary} order summary instance.
 */
function getLastOrder(customer) {
    // NOTE: currently we are using an existing orderID from within
    // digital to fill out the SOQL query string
    var orderHistory = customer.getOrderHistory();
    var customerOrders = orderHistory.getOrders(
        'status!={0}',
        'creationDate desc',
        Order.ORDER_STATUS_REPLACED
    );

    var apiResponse;
    if (customerOrders.getCount() > 0) {
        var order = customerOrders.first();
        apiResponse = getOrdersSummary([order.orderNo]);
    }

    return apiResponse;
}

module.exports = {
    getLastOrder: getLastOrder,
    getOrders: getOrders,
    getOrdersSummary: getOrdersSummary,
    getOrdersWithOneRequest: getOrdersWithOneRequest,
    getOrdersWithTwoRequests: getOrdersWithTwoRequests,
    getOrderAndFulfillment: getOrderAndFulfillment,
    getOrderSummaryQuery: getOrderSummaryQuery,
    preCancelOrderItems: preCancelOrderItems,
    cancelOrderItems: cancelOrderItems,
    preReturnOrderItems: preReturnOrderItems,
    returnOrderItems: returnOrderItems
};
