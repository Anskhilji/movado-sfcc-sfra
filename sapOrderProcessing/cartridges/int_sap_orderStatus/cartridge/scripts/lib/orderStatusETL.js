/**
 * Script to read file from impex location and parse it and populate SFCC Object's custom attributes.
 * srcDirPath: folder name underneath Impex share, src folder for input folder
 * targetErrorDirPath: folder name underneath Impex share, src target folder if file encounters a parsing error
 * targetSuccessDirPath: folder name underneath Impex share, src target folder if file is parsed Successfully
 * filePattern: file name pattern at src input folder
 */


var Util = require('dw/util');
var FileReader = require('dw/io/FileReader');
var XMLStreamReader = require('dw/io/XMLStreamReader');
var FileWriter = require('dw/io/FileWriter');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var XMLStreamConstants = require('dw/io/XMLStreamConstants');
var File = require('dw/io/File');
var StringUtils = require('dw/util/StringUtils');
var Logger = require('dw/system/Logger').getLogger('orderStatusETL');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var ArrayList = require('dw/util/ArrayList');
var FileHelper = require('bc_job_components/cartridge/scripts/file/FileHelper');
var Site = require('dw/system/Site');


/* Constants for elements and attributes obtained in the Order Status Feed File */
var ORDER = 'EcommerceOrderStatus';
var ORDER_STATUS_HEADER = 'EcommerceOrderStatusHeader';
var ORDER_STATUS_ITEM = 'EcommerceOrderStatusItem';
var ATTR_FEED_DATE = 'FeedDate';
var ATTR_SITE_ID = 'WebSiteID';
var ATTR_PO_NO = 'PONumber';
var ATTR_TRX_TYPE = 'TransactionType';
var ATTR_EVT_TYPE = 'EventType';
var ATTR_AMOUNT = 'Amount';
var ITEM_SKU_NUMBER = 'SKUNumber';
var ITEM_SHP_DATE = 'ShippedDate';
var ITEM_RJCTD_QTY = 'RejectedQuantity';
var ITEM_CNCL_DATE = 'CancelDate';
var ITEM_RCVD_QTY = 'ReceivedQuantity';
var ITEM_ORDERED_QTY = 'OrderQuantity';
var ITEM_SHP_QTY = 'ShippedQuantity';
var ITEM_CARRIER_CODE = 'CarrierCode';
var ITEM_TRACKING_CODE = 'TrackingNumber';
var ITEM_NUMBER = 'POItemNumber';
var CURRENCY = 'Currency';


/**
 * gets the existing amount List captured/refunded for order from BM
 * add the amount received from Status Feed in the amount List
 * @param {dw.util.ArrayList} : amountList
 * @param sapAmount : the amount to be added
 */
function addSapAttributeToList(attrList, sapAttr) {
    var updatedAmountList;
    if (!attrList || attrList == null || attrList.length < 1) {
        updatedAmountList = sapAttr;
    } else {
        updatedAmountList = attrList + '|' + sapAttr;
    }

    return updatedAmountList;
}


/**
 * Takes the success and archive directory path
 * moves the file to the particular success and archive location
 * @param {String} archiveDirectory  - Path of archive
 * @param {File} orderStatusFeedFile  - feed file
 */
function moveFileToTargetDirectory(archiveDirectory, orderStatusFeedFile) {
	/* getFeedFileName*/
    var fileName = orderStatusFeedFile.getName();
    var newFile = new File(archiveDirectory + fileName);

	/* check for directory exist or not*/
    var directory = new File(archiveDirectory);
    if (!directory.exists()) {
        directory.mkdirs();
    }

	/* check if file exist or not*/
    if (newFile.exists()) {
        newFile.remove();
    }

    orderStatusFeedFile.copyTo(newFile);
    orderStatusFeedFile.renameTo(newFile);
}


/**
 * takes the E-Commerce Line Item Header as an input
 * populates the LineItem custom attributes based on the data recieved in feed
 * @param {XML} orderItem - ECommerce Line Item Header
 */
function populateLineItemAttributes(xmlLineItem, orderNumber, eventType, transactionType) {
    var order,
        lineItems;
    var successFlag = false;
    var shippingLineItemID = Site.getCurrent().getCustomPreferenceValue('sapShippingLineItemID');

	/* get all child elements of <EcommerceOrderStatusItem>*/
    var childElements = xmlLineItem.children();

	/* get the PO Item Number ,If not received keep it empty*/
    var poItemNumber = xmlLineItem.child(ITEM_NUMBER);
    if (poItemNumber && poItemNumber != null && poItemNumber != '') {
        poItemNumber = parseInt(poItemNumber);
    }

    order = OrderMgr.getOrder(orderNumber);

    try {
        if (order) {
            lineItems = order.allLineItems;
            var productId;
            for (var i = 0; i < lineItems.length; i++) {
                var lineEventType;
                var lineTransactionType;
                var processLineItem = false;

				/* get the productId based on the type of Line Item*/
                if (lineItems[i] instanceof dw.order.ProductLineItem) {
                    if (lineItems[i].optionProductLineItem) {
                        if (lineItems[i].optionID && lineItems[i].optionID.toLowerCase().indexOf('emboss') > -1) {
                            productId = 'EMBOSSING';
                        } else if (lineItems[i].optionID && lineItems[i].optionID.toLowerCase().indexOf('engrave') > -1) {
                            productId = 'ENGRAVING';
                        } else {
                            var parent = lineItems[i].parent;
                            if (parent) {
                                productId = lineItems[i].parent.custom.giftBoxSKU;
                            }
                        }
                    } else {
                        productId = lineItems[i].productID;
                    }

                    lineEventType = lineItems[i].custom.sapEventType;
                    lineTransactionType = lineItems[i].custom.sapTransactionType;
                } else if (lineItems[i] instanceof dw.order.ShippingLineItem) {
                    if (shippingLineItemID) {
                        productId = shippingLineItemID;
                    } else {
                        productId = 'FIXEDFREIGHT';
                    }
                    lineEventType = lineItems[i].custom.sapEventType;
                    lineTransactionType = lineItems[i].custom.sapTransactionType;
                }

				/* logic to check if duplicates are recieved for line item*/
                if (productId == xmlLineItem.child(ITEM_SKU_NUMBER).toString() && (!lineEventType || !lineTransactionType)) {
                    processLineItem = true;
                } else if (productId == xmlLineItem.child(ITEM_SKU_NUMBER).toString() && lineTransactionType && lineEventType &&
						transactionType.toLowerCase() == 'update' &&
						(!(lineItems[i].custom.sapItemNumber) || lineItems[i].custom.sapItemNumber == poItemNumber)) {
                    processLineItem = true;
                }				else if (productId == xmlLineItem.child(ITEM_SKU_NUMBER).toString() && lineTransactionType && lineEventType
						&& (!(lineItems[i].custom.sapItemNumber) || lineItems[i].custom.sapItemNumber == poItemNumber)
						&& !(eventType.toLowerCase() == lineEventType.toLowerCase() && transactionType.toLowerCase() == lineTransactionType.toLowerCase())) {
                    processLineItem = true;
                }

				/* match the LineItem id in order with the Id received in OrderStatus Feed file*/
                if (productId === xmlLineItem.child(ITEM_SKU_NUMBER).toString() && processLineItem &&
						!(lineItems[i] instanceof dw.order.PriceAdjustment)) {
					/* Set all values received in Status feed in Line Item Custom Attributes*/
                    for (var k = 0; k < childElements.length(); k++) {
                        var childElement = childElements[k];

                        if (childElement && childElement != null && childElement != '' && childElement.localName() === ITEM_ORDERED_QTY) {
                            lineItems[i].custom.sapOrderQuantity = parseInt(childElement);
                        } else if (childElement && childElement != null && childElement != '' && childElement.localName() === ITEM_SHP_QTY) {
                            lineItems[i].custom.sapShippedQuantity = parseInt(childElement);
                        } else if (childElement && childElement != null && childElement != '' && childElement.localName() === ITEM_NUMBER) {
                            lineItems[i].custom.sapItemNumber = parseInt(childElement);
                        }						else if (childElement && childElement != null && childElement != '' && childElement.localName() === ITEM_RCVD_QTY) {
                            lineItems[i].custom.sapReceivedQuantity = parseInt(childElement);
                        } else if (childElement && childElement != null && childElement != '' && childElement.localName() === ITEM_RJCTD_QTY) {
                    lineItems[i].custom.sapRejectedQuantity = parseInt(childElement);
                } else if (childElement && childElement != null && childElement.localName() === ITEM_CNCL_DATE) {
                lineItems[i].custom.sapCancelDate = childElement.toString();
            } else if (childElement && childElement != null && childElement.localName() === ITEM_SHP_DATE) {
            lineItems[i].custom.sapShippedDate = childElement.toString();
        }						else if (childElement && childElement != null && childElement.localName() === ITEM_CARRIER_CODE) {
        lineItems[i].custom.sapCarrierCode = childElement.toString();
    }						else if (childElement && childElement != null && childElement.localName() === ITEM_TRACKING_CODE) {
        lineItems[i].custom.sapTrackingNumber = childElement.toString();
    }
                    }
					/* populate event type and transaction type at line level*/
                    if (eventType && transactionType) {
                        lineItems[i].custom.sapEventType = eventType;
                        lineItems[i].custom.sapTransactionType = transactionType;
                    }
					/* if item is matched and attributes populated , do not process the duplicate item if not received in feed*/
                    successFlag = true;
                    break;
                }
            }
        } else {
			/* throw error if order not found in BM*/
            Logger.error('orderStatusETL: Line Item attributes not populated as No order Exists with Order Id : ' + orderNumber);
            return successFlag;
        }

		/* return success if custom attributes populated for the matched line Item */
        Logger.debug('orderStatusETL: Line Item Attributes Populated Successfully with orderNumber : ' + orderNumber);
        return successFlag;
    } catch (e) {
        successFlag = false;
        Logger.error('orderStatusETL: Error occured while populating custom Line Item Attributes : ' + e + '\n' + e.stack);
        throw e;
    }
}


/**
 * takes the E-Commerce Order Item Header as an input
 * populates the Order custom attributes based on the data recieved in feed
 * @param {XML} orderItem - ECommerceOrderHeader
 */
function populateOrderAttributes(orderItem) {
    var sapTransactionType,
        orderId,
        order;
    var successFlag = false;
    var orderSiteId;
    var sapSiteId;
    var sapCurrencyCode;
    var childElements;
    var orderTransactionType;
    var orderEventType;
    var sapTransactions;
    var sapEvents;
    var orderCurrencyCode;
    var eventType;

	/* get all child elements of E-Commerce Status Header*/
    childElements = orderItem.children();


	/* get the order and validate the essential details before populating the order level information*/
    if (orderItem.child(ATTR_PO_NO) && orderItem.child(ATTR_PO_NO) != null) {
        orderId = orderItem.child(ATTR_PO_NO).toString();
        order = OrderMgr.getOrder(orderId);
    }
    if (orderItem.child(ATTR_TRX_TYPE)) {
        orderTransactionType = orderItem.child(ATTR_TRX_TYPE).toString().toLowerCase();
    }
    if (orderItem.child(ATTR_EVT_TYPE)) {
        orderEventType = orderItem.child(ATTR_EVT_TYPE).toString().toLowerCase();
    }
    if (orderItem.child(CURRENCY)) {
        orderCurrencyCode = orderItem.child(CURRENCY).toString();
    }
    if (orderItem.child(ATTR_SITE_ID)) {
        orderSiteId = orderItem.child(ATTR_SITE_ID).toString();
    }


	/* gets the Site Level Preferences*/
    sapSiteId = Site.getCurrent().getCustomPreferenceValue('sapSiteId');
    sapCurrencyCode = Site.getCurrent().getCustomPreferenceValue('sapCurrencyCode');
    sapTransactions = Site.getCurrent().getCustomPreferenceValue('sapTransactionAllowedValues');
    sapEvents = Site.getCurrent().getCustomPreferenceValue('sapEventAllowedValues');

    try {
		/* Set all values received in Status feed in Order Custom Attributes*/
        if (order && orderSiteId == sapSiteId && orderCurrencyCode == sapCurrencyCode
				&& sapTransactions.indexOf(orderTransactionType) != -1 && sapEvents.indexOf(orderEventType) != -1) {
            for (var i = 0; i < childElements.length(); i++) {
                var childElement = childElements[i];

                if (childElement && childElement.localName() === ATTR_FEED_DATE) {
                    order.custom.sapFeedDate = childElement;
                } else if (childElement && childElement.localName() === ATTR_SITE_ID) {
                    order.custom.sapWebSiteId = childElement;
                } else if (childElement && childElement.localName() === ATTR_PO_NO) {
                    order.custom.sapPONumber = childElement;
                } else if (childElement && childElement.localName() === ATTR_TRX_TYPE) {
                    sapTransactionType = childElement.toString();
                    var sapTransactionTypeList = order.custom.sapTransactionType;
                    var updatedTransactionTypeList = addSapAttributeToList(sapTransactionTypeList, sapTransactionType);
                    order.custom.sapTransactionType = updatedTransactionTypeList;
                } else if (childElement && childElement.localName() === ATTR_EVT_TYPE) {
                    eventType = childElement.toString();
                    var sapEventTypeList = order.custom.sapEventType;
                    var updatedEventTypeList = addSapAttributeToList(sapEventTypeList, eventType);
                    order.custom.sapEventType = updatedEventTypeList;
                } else if (childElement && childElement.localName() === ATTR_AMOUNT) {
                    var updatedAmountList;
                    if (sapTransactionType && sapTransactionType.toLowerCase() == 'capture') {
                var captureAmountList = order.custom.sapCaptureAmount;
                updatedAmountList = addSapAttributeToList(captureAmountList, childElement.toString());
                order.custom.sapCaptureAmount = updatedAmountList;
            } else if (sapTransactionType && (sapTransactionType.toLowerCase() == 'refund' || sapTransactionType.toLowerCase() == 'void')) {
            var refundAmountList = order.custom.sapRefundAmount;
            updatedAmountList = addSapAttributeToList(refundAmountList, childElement.toString());
            order.custom.sapRefundAmount = updatedAmountList;
        }
                }
            }
        } else {
			/* throw error if order not found in BM*/
            Logger.error('orderStatusETL: Order Not found or Site Id does not match in BM with order Number : ' + orderId + 'and Site Id' + orderSiteId);
            return { success: successFlag, orderNumber: orderId, eventType: eventType, transactionType: sapTransactionType };
        }

		/* return success if orderItem is processed successfully*/
        Logger.debug('orderStatusETL: Order Attributes Populated Successfully with orderNumber' + orderId);
        successFlag = true;
        return { success: successFlag, orderNumber: orderId, eventType: eventType, transactionType: sapTransactionType };
    } catch (e) {
        Logger.error('orderStatusETL: Error occured while populating custom Order Attribute: ' + e + '\n' + e.stack);
        return { success: successFlag, orderNumber: orderId, eventType: eventType, transactionType: sapTransactionType };
    }
}

/**
 * if any error occurs
 * clear the Sap Transaction and Sap Event at Line Level
 * @param order
 * @returns
 */
function clearSapAttributesAtLine(order) {
    var lineItems;
    var productId;

    if (order) {
        lineItems = order.allLineItems;
        for (var i = 0; i < lineItems.length; i++) {
            if (lineItems[i] instanceof dw.order.ProductLineItem || lineItems[i] instanceof dw.order.ShippingLineItem) {
                var lineStatus = lineItems[i].custom.sapLineStatus;
                if (!lineStatus || lineStatus == null || lineStatus == '') {
                    lineItems[i].custom.sapEventType = '';
                    lineItems[i].custom.sapTransactionType = '';
                }
            }
        }
    }
}


/**
 * sends mail if error files failed to process
 * @param parsingResult
 * @returns boolean
 */
function triggerEmail(errorMap) {
    try {
        var Mail = require('dw/net/Mail');
        var sendToMail = Site.getCurrent().getCustomPreferenceValue('orderStatusSentToMail');
        var sendFromMail = Site.getCurrent().getCustomPreferenceValue('orderStatusSentFromMail');
        var template = Util.Template('failedOrdersTemplate.isml');
        var contentMap = Util.HashMap();
        contentMap.put("errorMap" , errorMap);
        var text: MimeEncodedText = template.render(contentMap);
        mail = new Mail();
        mail.setSubject(' Order Status Import Error Notification.');
        mail.setFrom(sendFromMail);
        mail.addTo(sendToMail);
        mail.setContent(text);
        mail.send();
    } catch (e) {
        Logger.error('orderStatusETL: mail not sent due to exception : ' + e + '\n' + e.stack);
        return false;
    }
    return true;
}


/**
 * retrieves the Order Status Feed File from the Source Directory Path in IMPEX location
 * Parses the Feed File and call sub functions to populate SFCC System Objects Custom attributes
 * Moves the file in a archived Target location
 * @param {String} srcDirPath
 * @param {String} targetSuccessDirPath
 * @param {String} targetErrorDirPath
 * @param {String} filePattern
 */
function parseorderStatusFile(srcDirPath, targetSuccessDirPath, targetErrorDirPath, filePattern) {
    var xmlReader = null;
    var directory;
    var archiveErrorDirectory = File.IMPEX + File.SEPARATOR + targetErrorDirPath;
    var archiveSuccessDirectory = File.IMPEX + File.SEPARATOR + targetSuccessDirPath;
    var inputFilePath,
        orderfeedFiles,
        file;

    var parsingResult = {
        status: false,
        statusMessage: '',
        errorFiles: [],
        errorOrders: [],
        successOrders: [],
        successFiles: []
    };
    
    var errorMap = Util.HashMap();
    var fileErrorMap = Util.HashMap();
    
	/* loop through all feed files in IMPEX location */
    inputFilePath = File.IMPEX + File.SEPARATOR + srcDirPath;
    orderfeedFiles = FileHelper.getFiles(inputFilePath, filePattern);

    for (var i = 0; i < orderfeedFiles.length; i++) {
    	
        try {
            var errorFileMoved = false;
            file = new File(orderfeedFiles[i]);

			/* check if file is already processed*/
            if (FileHelper.isFileExists(archiveSuccessDirectory, file.name)) {
                parsingResult.errorFiles.push({ file: file });
                errorFileMoved = true;
            } else {
                var fileReader = new FileReader(file);
                

				/* if file not present then continue and check the next file in directory*/
                if (!fileReader) {
                    Logger.error('orderStatusETL: File not found at path: ' + inputFilePath);
                    parsingResult.errorFiles.push({ file: file });
                } else {
					/* Parse Order Status XML File*/
                    var tempLocalName = '';
                    var parseEvent = 0;
                    xmlReader = new XMLStreamReader(fileReader);

					/* read file using stream reader */
                    while (xmlReader.hasNext()) {
                    	var parsedSuccessfully = true;
                        parseEvent = xmlReader.next();
                        if (parseEvent === XMLStreamConstants.START_ELEMENT) {
                            tempLocalName = StringUtils.trim(xmlReader.getLocalName());
                            if (tempLocalName == ORDER) {
								/* read the XML in EcommerceOrderStatus and get the XML object */
                                var orderInfoXMLObject = xmlReader.readXMLObject();

								/* get all child elements of the EcommerceOrderStatus XML Object*/
                                var orderChildElements;
                                if (orderInfoXMLObject) {
                                    orderChildElements = orderInfoXMLObject.children();
                                } else {
                                    orderChildElements = [];
                                }


                                var orderNumber,
                                    orderAttributesPopulated,
                                    lineAttributesPopulated,
                                    order,
                                    eventType,
                                    transactionType;

								/* get total number of line items received in feed*/
                                var lineItemsRecievedInFeed = 0;

                                Transaction.wrap(function () {
                                    for (var i = 0; i < orderChildElements.length(); i++) {
                                        var orderItem = orderChildElements[i];

										/* check if it is Order Header Information, populate order level custom attributes*/
                                        if (orderItem && orderItem.localName() !== null && orderItem.localName().toString() === ORDER_STATUS_HEADER) {
                                            var orderResult = populateOrderAttributes(orderItem);
                                            orderNumber = orderResult.orderNumber;
                                            eventType = orderResult.eventType;
                                            transactionType = orderResult.transactionType;
                                            orderAttributesPopulated = orderResult.success;
                                            if(!orderAttributesPopulated){
                                                parsedSuccessfully = false;
                                            } else {
                                            	 parsedSuccessfully = true;
                                            }
                                        }
										/* check if it is LineItem Information, populate line item level custom attributes*/
                                        if (orderNumber && orderItem && orderItem.localName() !== null && orderItem.localName().toString() === ORDER_STATUS_ITEM) {
                                            var statusFlag = populateLineItemAttributes(orderItem, orderNumber, eventType, transactionType);
                                            lineItemsRecievedInFeed += 1;

											/* logic to check if all line items have been populated then only mark success*/
                                            if (statusFlag == false) {
                                                lineAttributesPopulated = false;
                                            } else if (!lineAttributesPopulated) {
                                            	lineAttributesPopulated = true;
                                            }
                                        }
                                        if(!parsedSuccessfully){
                                            var errorOrderObj = {
                                                    eventType : eventType,
                                                    sapTransactionType : transactionType,
                                                    orderId : orderNumber
                                            };
                                            if (!fileErrorMap.containsKey(orderNumber)) {
                                                fileErrorMap.put( orderNumber, '1');
                                                parsingResult.errorOrders.push({ errorOrderObj: errorOrderObj });
                                            }
                                        }
                                    }

                                    /* Mark the order in processing phase so it could be processed in the next Job*/
                                    order = OrderMgr.getOrder(orderNumber);
                                    if (eventType && eventType.toLowerCase() != 'credit' && orderAttributesPopulated && lineAttributesPopulated && parsedSuccessfully) {
                                        order.custom.processingFlag = true;
                                        var existingItems = order.custom.totalLineItemsReceived;
                                        if (order.custom.totalLineItemsReceived && parseInt(order.custom.totalLineItemsReceived) > 0) {
                                            var existingItems = parseInt(order.custom.totalLineItemsReceived);
                                            var totalLineItemsReceived = existingItems + lineItemsRecievedInFeed;
                                            order.custom.totalLineItemsReceived = totalLineItemsReceived.toString();
                                        } else {
                                            order.custom.totalLineItemsReceived = lineItemsRecievedInFeed.toString();
                                        }

                                        /* Move the order to success array*/
                                        Logger.debug('orderStatusETL: File Parsed Successfully with fileName: ' + file.name);
                                        parsingResult.successOrders.push({ orderId: order.orderNo });
                                    } else if (eventType && eventType.toLowerCase() == 'credit' && orderAttributesPopulated && parsedSuccessfully) {
                                        order.custom.processingFlag = true;
                                        /* Move the file to success Archive directory if all processing is successful*/
                                        Logger.debug('orderStatusETL: File Parsed Successfully with fileName: ' + file.name);
                                        parsingResult.successOrders.push({ orderId: order.orderNo });
                                    } else {
                                        clearSapAttributesAtLine(order);
                                        Logger.error('orderStatusETL: File Moved to error folder as attributes were not populated : ');
                                        
                                    }
                                });
                            }
                        }
                    }
                }
            }
        } catch (e) {
			/* move the file to archive error folder if there is any exception*/
            Logger.error('orderStatusETL: Exception occured while parsing XML : ' + e + '\n' + e.stack);
            parsingResult.errorFiles.push({ file: orderfeedFiles[i] });
            errorMap.put(file.name , parsingResult.errorOrders);
            var archiveErrorDirectory = File.IMPEX + File.SEPARATOR + targetErrorDirPath;
            moveFileToTargetDirectory(archiveErrorDirectory, file);
            errorFileMoved = true;
        }
        
		/* Move the file to success Files Array if all processing is successful*/
        if (parsingResult.errorOrders.length > 0 && !errorFileMoved) {
            parsingResult.errorFiles.push({ file: file });
            errorMap.put(file.name , parsingResult.errorOrders);
            parsingResult.errorOrders = [];
            fileErrorMap.clear();
        } else if (!errorFileMoved) {
            parsingResult.successFiles.push({ file: file });
        }
        
    }

	/* return result based on error Files array and success Files array*/
    if (parsingResult.errorFiles.length > 0) {
        parsingResult.status = false;
        parsingResult.statusMessage = 'Some Orders or Files Failed with Exception';
        triggerEmail(errorMap);
        for (var i = 0; i < parsingResult.errorFiles.length; i++) {
            moveFileToTargetDirectory(archiveErrorDirectory, parsingResult.errorFiles[i].file);
        }
        return parsingResult;
    } else if (parsingResult.successFiles.length > 0) {
        parsingResult.status = true;
        parsingResult.statusMessage = 'All Files Parsed Successfully';
        for (var i = 0; i < parsingResult.successFiles.length; i++) {
            moveFileToTargetDirectory(archiveSuccessDirectory, parsingResult.successFiles[i].file);
        }
        return parsingResult;
    }

    parsingResult.status = true;
    parsingResult.statusMessage = 'No feed Files to process';
    return parsingResult;
}


module.exports.parseorderStatusFile = parseorderStatusFile;
