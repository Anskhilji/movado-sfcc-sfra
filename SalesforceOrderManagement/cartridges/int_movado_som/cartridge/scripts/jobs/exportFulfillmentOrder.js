/* eslint-disable max-len */
'use strict';
var Site = require('dw/system/Site');
var Status = require('dw/system/Status');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var Logger = require('dw/system/Logger').getLogger('custom.SOM.exportFulfillmentOrder');
var FileHelper = require('*/cartridge/scripts/file/FileHelper');
var moment = require('*/cartridge/scripts/libs/moment');
var _ = require('*/cartridge/scripts/libs/underscore');


/**
 * writeXmlElement
 * @param {StreamWriter} sw Current StreamWriter
 * @param {StreamWriter} elementName XML element name to write
 * @param {StreamWriter} elementValue XML element value to write
 * @param {StreamWriter} isCurrency Force treatment as float
 * @return {null}
 */
function writeXmlElement(sw, elementName, elementValue, isCurrency) {
    var val = elementValue;
    if (isCurrency && !isNaN(parseFloat(val)) && isFinite(val)) {
        val = parseFloat(elementValue).toFixed(2);
    }

    if (val && val !== '') {
        sw.writeStartElement(elementName);
        sw.writeCharacters(val);
        sw.writeEndElement();
        sw.writeRaw('\r\n');
    } else {
        sw.writeEmptyElement(elementName);
    }
}

/**
 * writeXmlElement
 * @param {StreamWriter} sw Current StreamWriter
 * @param {StreamWriter} elementName XML element name to write
 * @param {StreamWriter} elementValue XML element value to write
 * @param {StreamWriter} isCurrency Force treatment as float
 * @return {null}
 */
function createSAPOrderFile(args, impexFilePath, record) {
    var WebOrderCreationTimeZone = Site.getCurrent().getCustomPreferenceValue('webOrderCreationTimeZone');
    var filePattern = args.FilePattern;

    // SAP requires the delivery charge to be the last PO line item.  SFDC returns JSON as backwards alpha sort, so we re-sort by poItemNumber here
    var poItemsSorted = _.sortBy(record.poItems, 'poItemNumber');

    var fileName = '';
    if (Object.hasOwnProperty.call(record.poHeader, 'internalIdentifier')) {
        fileName = record.poHeader.poNumber + '_' + record.poHeader.internalIdentifier + '_' + moment().format('YYYYMMDD_hhmmss') + filePattern;
    } else {
        fileName = record.poHeader.poNumber + '_' + moment().format('YYYYMMDD_hhmmss') + filePattern;
    }
    var file = new File(impexFilePath + fileName);

    var fileWriter = new FileWriter(file, true);
    var streamWriter = new XMLStreamWriter(fileWriter);

    if (streamWriter) {
        streamWriter.writeRaw('<?xml version="1.0" encoding="UTF-8"?>\r\n');
        /* Start of the root element*/
        streamWriter.writeStartElement('root');
        streamWriter.writeCharacters('');
        streamWriter.writeRaw('\r\n');

        /* Start of the Order header element*/
        streamWriter.writeStartElement('EcommerceOrder');
        streamWriter.writeCharacters('');
        streamWriter.writeRaw('\r\n');

        /* EcommercePOHeader Elements: starts*/
        streamWriter.writeStartElement('EcommercePOHeader');
        streamWriter.writeCharacters('');
        streamWriter.writeRaw('\r\n');

        writeXmlElement(streamWriter, 'WebSiteID', record.poHeader.webSiteID);
        writeXmlElement(streamWriter, 'OrderType', record.poHeader.orderType);
        writeXmlElement(streamWriter, 'POType', record.poHeader.poType);
        if (Object.hasOwnProperty.call(record.poHeader, 'reasonCode')) {
            writeXmlElement(streamWriter, 'ReasonCode', record.poHeader.reasonCode);
        } else {
            writeXmlElement(streamWriter, 'ReasonCode', '');
        }
        writeXmlElement(streamWriter, 'WebOrderCreationTimeStamp', record.poHeader.webOrderCreationTimeStamp);
        writeXmlElement(streamWriter, 'WebOrderCreationTimeZone', WebOrderCreationTimeZone);
        writeXmlElement(streamWriter, 'PONumber', record.poHeader.poNumber);
        writeXmlElement(streamWriter, 'PODate', record.poHeader.poDate);
        writeXmlElement(streamWriter, 'ReferenceOrder', record.poHeader.referenceOrder);
        writeXmlElement(streamWriter, 'ShiptoName', record.poHeader.shipToName);
        writeXmlElement(streamWriter, 'ShiptoName2', (Object.hasOwnProperty.call(record.poHeader, 'shiptoName2')) ? record.poHeader.shiptoName2 : '');
        writeXmlElement(streamWriter, 'ShiptoCompany', (Object.hasOwnProperty.call(record.poHeader, 'shipToCompany')) ? record.poHeader.shipToCompany : '');
        writeXmlElement(streamWriter, 'ShiptoCountry', record.poHeader.shipToCountry);
        writeXmlElement(streamWriter, 'ShiptoAddress1', record.poHeader.shipToAddress1);
        writeXmlElement(streamWriter, 'ShiptoAddress2', (Object.hasOwnProperty.call(record.poHeader, 'shipToAddress2')) ? record.poHeader.shipToAddress2 : '');
        writeXmlElement(streamWriter, 'ShiptoAddress3', (Object.hasOwnProperty.call(record.poHeader, 'shipToAddress3')) ? record.poHeader.shipToAddress3 : '');
        writeXmlElement(streamWriter, 'ShiptoAddress4', (Object.hasOwnProperty.call(record.poHeader, 'shipToAddress4')) ? record.poHeader.shipToAddress4 : '');
        writeXmlElement(streamWriter, 'ShiptoCity', record.poHeader.shipToCity);
        writeXmlElement(streamWriter, 'ShiptoPostalCode', record.poHeader.shipToPostalCode);
        writeXmlElement(streamWriter, 'ShiptoRegion', record.poHeader.shipToRegion);
        writeXmlElement(streamWriter, 'ShiptoPhone', record.poHeader.shipToPhone);
        writeXmlElement(streamWriter, 'BilltoName', record.poHeader.billToName);
        writeXmlElement(streamWriter, 'BilltoName2', (Object.hasOwnProperty.call(record, 'billToName2')) ? record.poHeader.billToName2 : '');
        writeXmlElement(streamWriter, 'BilltoCountry', record.poHeader.billToCountry);
        writeXmlElement(streamWriter, 'BilltoAddress1', record.poHeader.billToAddress1);
        writeXmlElement(streamWriter, 'BilltoAddress2', (Object.hasOwnProperty.call(record.poHeader, 'billToAddress2')) ? record.poHeader.billToAddress2 : '');
        writeXmlElement(streamWriter, 'BilltoAddress3', (Object.hasOwnProperty.call(record.poHeader, 'billToAddress3')) ? record.poHeader.billToAddress3 : '');
        writeXmlElement(streamWriter, 'BilltoAddress4', (Object.hasOwnProperty.call(record.poHeader, 'billToAddress4')) ? record.poHeader.billToAddress4 : '');
        writeXmlElement(streamWriter, 'BilltoCity', record.poHeader.billToCity);
        writeXmlElement(streamWriter, 'BilltoPostalCode', record.poHeader.billToPostalCode);
        writeXmlElement(streamWriter, 'BilltoRegion', record.poHeader.billToRegion);
        writeXmlElement(streamWriter, 'BilltoPhone', record.poHeader.billToPhone);
        writeXmlElement(streamWriter, 'CarrierCode', record.poHeader.carrierCode);
        writeXmlElement(streamWriter, 'VATEntity', '');
        if (Object.hasOwnProperty.call(record.poHeader, 'commercialEntity')) {
            writeXmlElement(streamWriter, 'CommercialEntity', record.poHeader.commercialEntity);
        }
        writeXmlElement(streamWriter, 'InventoryLocation', record.poHeader.inventoryLocation);
        writeXmlElement(streamWriter, 'BillingCurrency', record.poHeader.billingCurrency);
        writeXmlElement(streamWriter, 'PriceBookId', record.poHeader.priceBookId);
        writeXmlElement(streamWriter, 'PriceBookCurrency', record.poHeader.priceBookCurrency);
        if (Object.hasOwnProperty.call(record.poHeader, 'crossBorderSystemReference')) {
            writeXmlElement(streamWriter, 'CrossBorderSystemReference', record.poHeader.crossBorderSystemReference);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'subTotal')) {
            writeXmlElement(streamWriter, 'SubTotal', record.poHeader.subTotal.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'totalTax')) {
            writeXmlElement(streamWriter, 'TotalTax', record.poHeader.totalTax.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'totalInsAmount')) {
            writeXmlElement(streamWriter, 'TotalDutyAmount', record.poHeader.totalDutyAmount.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'totalInsAmount')) {
            writeXmlElement(streamWriter, 'TotalInsAmount', record.poHeader.totalInsAmount.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'giftCardAmount')) {
            writeXmlElement(streamWriter, 'GiftCardAmount', record.poHeader.giftCardAmount.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'totalLoyaltyAmount')) {
            writeXmlElement(streamWriter, 'TotalLoyaltyAmount', record.poHeader.totalLoyaltyAmount.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'netAmount')) {
            writeXmlElement(streamWriter, 'NetAmount', record.poHeader.netAmount.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'authAmount')) {
            writeXmlElement(streamWriter, 'AuthAmount', record.poHeader.authAmount.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'chargingShipping')) {
            writeXmlElement(streamWriter, 'ChargingShipping', record.poHeader.chargingShipping);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'shippingCost')) {
            writeXmlElement(streamWriter, 'ShippingCost', record.poHeader.shippingCost.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'shippingByMGI')) {
            writeXmlElement(streamWriter, 'ShippingByMGI', record.poHeader.shippingByMGI);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'dutyByMGI')) {
            writeXmlElement(streamWriter, 'DutyByMGI', record.poHeader.dutyByMGI);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'insByMGI')) {
            writeXmlElement(streamWriter, 'InsByMGI', record.poHeader.insByMGI);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'dutyInclusive')) {
            writeXmlElement(streamWriter, 'DutyInclusive', record.poHeader.dutyInclusive);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'vatInclusive')) {
            writeXmlElement(streamWriter, 'VATInclusive', record.poHeader.vatInclusive);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'paymentMethod')) {
            writeXmlElement(streamWriter, 'PaymentMethod', record.poHeader.paymentMethod);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'authExpirationDate')) {
            writeXmlElement(streamWriter, 'AuthExpirationDate', record.poHeader.authExpirationDate);
        } else {
            writeXmlElement(streamWriter, 'AuthExpirationDate', moment().add(10, 'days').format('YYYYMMDD'));
        }

        // ESW
        if (Object.hasOwnProperty.call(record.poHeader, 'consumerExchangeRate')) {
            writeXmlElement(streamWriter, 'ConsumerExchangeRate', record.poHeader.consumerExchangeRate.toFixed(4));
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'consumerCurrency')) {
            writeXmlElement(streamWriter, 'ConsumerCurrency', record.poHeader.consumerCurrency);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'consumerSubTotal')) {
            writeXmlElement(streamWriter, 'ConsumerSubTotal', record.poHeader.consumerSubTotal.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'consumerTotalTax')) {
            writeXmlElement(streamWriter, 'ConsumerTotalTax', record.poHeader.consumerTotalTax.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'consumerTotalDutyAmount')) {
            writeXmlElement(streamWriter, 'ConsumerTotalDutyAmount', record.poHeader.consumerTotalDutyAmount.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'consumerNetAmount')) {
            writeXmlElement(streamWriter, 'ConsumerNetAmount', record.poHeader.consumerNetAmount.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'consumerAuthAmount')) {
            writeXmlElement(streamWriter, 'ConsumerAuthAmount', record.poHeader.consumerAuthAmount.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'consumerTotalInsAmount')) {
            writeXmlElement(streamWriter, 'ConsumerTotalInsAmount', record.poHeader.consumerTotalInsAmount.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'consumerGiftCardAmount')) {
            writeXmlElement(streamWriter, 'ConsumerGiftCardAmount', record.poHeader.consumerGiftCardAmount.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'consumerTotalLoyaltyAmount')) {
            writeXmlElement(streamWriter, 'ConsumerTotalLoyaltyAmount', record.poHeader.consumerTotalLoyaltyAmount.toFixed(2), true);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'incoterms')) {
            writeXmlElement(streamWriter, 'Incoterms', record.poHeader.incoterms);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'consTaxByMGI')) {
            writeXmlElement(streamWriter, 'ConsTaxByMGI', record.poHeader.consTaxByMGI);
        }
        if (Object.hasOwnProperty.call(record.poHeader, 'totalConsTaxByMGI')) {
            writeXmlElement(streamWriter, 'TotalConsTaxByMGI', record.poHeader.totalConsTaxByMGI.toFixed(2), true);
        }

        // Reserved use
        writeXmlElement(streamWriter, 'UserField1', '');
        writeXmlElement(streamWriter, 'UserField2', '');
        writeXmlElement(streamWriter, 'UserField3', '');
        writeXmlElement(streamWriter, 'UserField4', '');

        /* Create EcommercePOHeader Elements : end */
        streamWriter.writeEndElement();

        /* Create EcommercePOItem Elements : start */
        poItemsSorted.forEach(function (poItem) {
            /* Start EcommercePOItem */
            streamWriter.writeStartElement('EcommercePOItem');
            streamWriter.writeCharacters('');
            streamWriter.writeRaw('\r\n');

            writeXmlElement(streamWriter, 'POItemNumber', poItem.poItemNumber);
            writeXmlElement(streamWriter, 'SKUNumber', poItem.skuNumber);
            writeXmlElement(streamWriter, 'Quantity', poItem.quantity);
            writeXmlElement(streamWriter, 'PreSale', poItem.preSale);
            writeXmlElement(streamWriter, 'RequestedDeliveryDate', poItem.requestedDeliveryDate);
            writeXmlElement(streamWriter, 'IsThisBillable', poItem.isThisBillable);
            writeXmlElement(streamWriter, 'InventoryLocation', poItem.inventoryLocation);
            if (Object.hasOwnProperty.call(poItem, 'vatEntity')) {
                writeXmlElement(streamWriter, 'VATEntity', poItem.vatEntity);
            }
            if (Object.hasOwnProperty.call(poItem, 'commercialEntity')) {
                writeXmlElement(streamWriter, 'CommercialEntity', poItem.commercialEntity);
            }
            if (Object.hasOwnProperty.call(poItem, 'grossValue')) {
                writeXmlElement(streamWriter, 'GrossValue', poItem.grossValue.toFixed(2), true);
            }
            writeXmlElement(streamWriter, 'MarkDownAmount', '');
            if (Object.hasOwnProperty.call(poItem, 'promoCode')) {
                writeXmlElement(streamWriter, 'PromoCode', poItem.promoCode);
            }
            if (Object.hasOwnProperty.call(poItem, 'promoAmount')) {
                writeXmlElement(streamWriter, 'PromoAmount', poItem.promoAmount.toFixed(2), true);
            }
            if (Object.hasOwnProperty.call(poItem, 'roundingAmount')) { 
                writeXmlElement(streamWriter, 'RoundingAmount', poItem.roundingAmount.toFixed(2), true);
            }
            if (Object.hasOwnProperty.call(poItem, 'loyaltyAmount')) {
                writeXmlElement(streamWriter, 'LoyaltyAmount', poItem.loyaltyAmount.toFixed(2), true);
            }
            if (Object.hasOwnProperty.call(poItem, 'subTotal')) {
                writeXmlElement(streamWriter, 'SubTotal', poItem.subTotal.toFixed(2), true);
            }
            if (Object.hasOwnProperty.call(poItem, 'taxAmount')) {
                writeXmlElement(streamWriter, 'TaxAmount', poItem.taxAmount.toFixed(2), true);
            }
            writeXmlElement(streamWriter, 'Tax1', poItem.tax1 || 0, true);
            writeXmlElement(streamWriter, 'Tax2', poItem.tax2 || 0, true);
            writeXmlElement(streamWriter, 'Tax3', poItem.tax3 || 0, true);
            writeXmlElement(streamWriter, 'Tax4', poItem.tax4 || 0, true);
            writeXmlElement(streamWriter, 'Tax5', poItem.tax5 || 0, true);
            writeXmlElement(streamWriter, 'Tax6', poItem.tax6 || 0, true);
            if (Object.hasOwnProperty.call(poItem, 'netAmount')) {
                writeXmlElement(streamWriter, 'NetAmount', poItem.netAmount.toFixed(2), true);
            }
            if (Object.hasOwnProperty.call(poItem, 'shippingCost')) {
                writeXmlElement(streamWriter, 'ShippingCost', poItem.shippingCost.toFixed(2), true);
            }
            if (Object.hasOwnProperty.call(poItem, 'consTaxByMGI')) {
                writeXmlElement(streamWriter, 'ConsTaxByMGI', poItem.consTaxByMGI.toFixed(2), true);
            }
            if (Object.hasOwnProperty.call(poItem, 'consumerGrossValue')) {
                writeXmlElement(streamWriter, 'ConsumerGrossValue', poItem.consumerGrossValue.toFixed(2), true);
            }
            if (Object.hasOwnProperty.call(poItem, 'consumerMarkDownAmount')) {
                writeXmlElement(streamWriter, 'ConsumerMarkDownAmount', poItem.consumerMarkDownAmount.toFixed(2), true);
            }
            if (Object.hasOwnProperty.call(poItem, 'consumerPromoAmount')) {
                writeXmlElement(streamWriter, 'ConsumerPromoAmount', poItem.consumerPromoAmount.toFixed(2), true);
            }
            if (Object.hasOwnProperty.call(poItem, 'consumerRoundingAmount')) {
                writeXmlElement(streamWriter, 'ConsumerRoundingAmount', poItem.consumerRoundingAmount.toFixed(2), true);
            }
            if (Object.hasOwnProperty.call(poItem, 'consumerLoyaltyAmount')) {
                writeXmlElement(streamWriter, 'ConsumerLoyaltyAmount', poItem.consumerLoyaltyAmount.toFixed(2), true);
            }
            if (Object.hasOwnProperty.call(poItem, 'consumerSubTotal')) {
                writeXmlElement(streamWriter, 'ConsumerSubTotal', poItem.consumerSubTotal.toFixed(2), true);
            }
            if (Object.hasOwnProperty.call(poItem, 'consumerTaxAmount')) {
                writeXmlElement(streamWriter, 'ConsumerTaxAmount', poItem.consumerTaxAmount.toFixed(2), true);
            }
            if (Object.hasOwnProperty.call(poItem, 'consumerDutyAmount')) {
                writeXmlElement(streamWriter, 'ConsumerDutyAmount', poItem.consumerDutyAmount.toFixed(2), true);
            }
            if (Object.hasOwnProperty.call(poItem, 'consumerInsAmount')) {
                writeXmlElement(streamWriter, 'ConsumerInsAmount', poItem.consumerInsAmount.toFixed(2), true);
            }
            if (Object.hasOwnProperty.call(poItem, 'consumerNetAmount')) {
                writeXmlElement(streamWriter, 'ConsumerNetAmount', poItem.consumerNetAmount.toFixed(2), true);
            }

            /* Create EcommercePOItemPersonalization Elements : start */
            if (poItem.personalizations) {
                poItem.personalizations.forEach(function (personalization) {
                    /* Gift Wrapping / Personalization */
                    streamWriter.writeStartElement('EcommercePOItemPersonalization');
                    streamWriter.writeCharacters('');
                    streamWriter.writeRaw('\r\n');

                    writeXmlElement(streamWriter, 'PersonalizationType', personalization.personalizationType);
                    writeXmlElement(streamWriter, 'LanguageID', '');
                    writeXmlElement(streamWriter, 'IsThisBillable', personalization.isThisBillable);
                    if (personalization.text) {
                        streamWriter.writeStartElement('Text');
                        streamWriter.writeCharacters('');
                        streamWriter.writeRaw('\r\n');

                        writeXmlElement(streamWriter, 'SequenceNumber', personalization.text.sequenceNumber);
                        writeXmlElement(streamWriter, 'TextMessage', personalization.text.textMessage);

                        /* Create Text Elements : end */
                        streamWriter.writeEndElement();
                        streamWriter.writeRaw('\r\n');
                    }

                    /* Create EcommercePOItemPersonalization Elements : end */
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                });
            }

            /* Create EcommercePOItem Elements : end */
            streamWriter.writeEndElement();
            streamWriter.writeRaw('\r\n');
        });

        /* End of the Order element*/
        streamWriter.writeEndElement();
        streamWriter.writeRaw('\r\n');

        /* End of the root element*/
        streamWriter.writeEndElement();
        streamWriter.writeRaw('\r\n');

        /* End of stream writing to file*/
        streamWriter.writeEndDocument();
        streamWriter.flush();
        streamWriter.close();

        fileWriter.close();

    } else {
        return new Status(Status.ERROR, 'ERROR', 'exportFulfillmentOrder unable to create streamwriter');
    }
    return true;

}

/**
 * exportFulfillmentOrder
 * @param {Object} args The arguments passed into the job
 * @return {dw.system.Status} Returns the status of the job
 */
function exportFulfillmentOrder(args) {
    var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');

    var impexFilePath = Site.getCurrent().getCustomPreferenceValue('orderExportImpexFilePath');
    FileHelper.createDirectory(impexFilePath);

    var endpoint = '/services/apexrest/orderexport';
    if ('OrderIDs' in args && args.OrderIDs !== '') {
        endpoint += '?orderIDs=' + args.OrderIDs;
    }

    var exportData = SalesforceModel.createSalesforceRestRequest({
        requestMethod: 'GET',
        url: endpoint
    });
    if (!exportData || !exportData.ok || exportData.error) {
        Logger.error('exportError=' + exportData.error + ' exportMsg=' + exportData.msg);
        return new Status(Status.ERROR, 'ERROR', 'exportError=' + exportData.error + ' exportMsg=' + exportData.msg);
    }
    if ('errorCode' in exportData.object[0] && exportData.object[0].errorCode === 'NO CONTENT') {
        return new Status(Status.OK, 'OK', 'exportFulfillmentOrder finished - no new records found');
    }

    var responseBody = exportData.ok ? exportData.object.toArray() : [];

    Logger.debug('Retrieved ' + responseBody.length + ' fulfillment order objects');
    Logger.info(JSON.stringify(responseBody));

    if (responseBody.length) {
        responseBody.forEach(function (record) {
            createSAPOrderFile(args, impexFilePath, record);
        });
    }

    return new Status(Status.OK, 'OK', 'exportFulfillmentOrder finished successfully or no new records found');
}

/**
 * exportFulfillmentOrder
 * @param {Object} args The arguments passed into the job
 * @return {dw.system.Status} Returns the status of the job
 */
function exportAppeasementOrder(args) {
    var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');

    var impexFilePath = Site.getCurrent().getCustomPreferenceValue('orderExportImpexFilePath') + 'appeasement' + File.SEPARATOR;
    FileHelper.createDirectory(impexFilePath);

    var endpoint = '/services/apexrest/orderappeasement';

    var exportData = SalesforceModel.createSalesforceRestRequest({
        requestMethod: 'GET',
        url: endpoint
    });
    if (!exportData || exportData.error || exportData.msg !== 'OK') {
        Logger.error('No data.  exportError=' + exportData.error + ' exportMsg=' + exportData.msg);
    }

    var responseBody = exportData.ok ? exportData.object.toArray() : [];

    Logger.debug('Retrieved ' + responseBody.length + ' change/appeasement order objects');
    Logger.info(JSON.stringify(responseBody));

    if (responseBody.length) {
        responseBody.forEach(function (record) {
            createSAPOrderFile(args, impexFilePath, record);
        });
    }

    return new Status(Status.OK, 'OK', 'exportAppeasementOrder finished successfully or no new records found');
}

module.exports.exportFulfillmentOrder = exportFulfillmentOrder;
module.exports.exportAppeasementOrder = exportAppeasementOrder;