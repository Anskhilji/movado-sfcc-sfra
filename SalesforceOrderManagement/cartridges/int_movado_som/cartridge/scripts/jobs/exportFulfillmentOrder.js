/* eslint-disable max-len */
'use strict';
var Site = require('dw/system/Site');
var Status = require('dw/system/Status');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var Logger = require('dw/system/Logger').getLogger('custom.SOM.exportFulfillmentOrder');
var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');
var FileHelper = require('*/cartridge/scripts/file/FileHelper');
var moment = require('*/cartridge/scripts/libs/moment');

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
 * exportFulfillmentOrder
 * @param {Object} args The arguments passed into the job
 * @return {dw.system.Status} Returns the status of the job
 */
function exportFulfillmentOrder(args) {
  var filePattern = args.FilePattern;

  var maxRecords = Site.getCurrent().getCustomPreferenceValue('maxFulfillmentOrderReturn') || 1000;
  var impexFilePath = Site.getCurrent().getCustomPreferenceValue('orderExportImpexFilePath');
  var WebOrderCreationTimeZone = Site.getCurrent().getCustomPreferenceValue('webOrderCreationTimeZone');

  FileHelper.createDirectory(impexFilePath);

  var exportData = SalesforceModel.createSalesforceRestRequest({
    requestMethod: 'GET',
    url: '/services/apexrest/orderexport'
  });
  if (!exportData || exportData.error || exportData.msg !== 'OK') {
    Logger.error('No data.  exportError=' + exportData.error + ' exportMsg=' + exportData.msg);
  }

  var responseBody = exportData.ok ? exportData.object.toArray() : [];

  Logger.debug('Retrieved ' + responseBody.length + ' fulfillment order objects');
  Logger.info(JSON.stringify(responseBody));

  if (responseBody.length) {
    responseBody.forEach(function (record) {
      var fileName = record.poHeader.poNumber + '_' + moment().format('YYYYMMDD_hhmmss') + filePattern;
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
        writeXmlElement(streamWriter, 'ReasonCode', '');
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
        writeXmlElement(streamWriter, 'CommercialEntity', '');
        writeXmlElement(streamWriter, 'InventoryLocation', '');
        writeXmlElement(streamWriter, 'BillingCurrency', record.poHeader.billingCurrency);
        writeXmlElement(streamWriter, 'ConsumerExchangeRate', '');
        writeXmlElement(streamWriter, 'ConsumerCurrency', '');
        writeXmlElement(streamWriter, 'PriceBookId', record.poHeader.priceBookId);
        writeXmlElement(streamWriter, 'PriceBookCurrency', record.poHeader.priceBookCurrency);
        writeXmlElement(streamWriter, 'CrossBorderSystemReference', '');
        writeXmlElement(streamWriter, 'SubTotal', record.poHeader.subTotal.toFixed(2));
        writeXmlElement(streamWriter, 'TotalTax', record.poHeader.totalTax.toFixed(2));
        writeXmlElement(streamWriter, 'TotalDutyAmount', (Object.hasOwnProperty.call(record.poHeader, 'totalDutyAmount')) ? record.poHeader.totalDutyAmount : '');
        writeXmlElement(streamWriter, 'TotalInsAmount', '');
        writeXmlElement(streamWriter, 'GiftCardAmount', '');
        writeXmlElement(streamWriter, 'TotalLoyaltyAmount', '');
        writeXmlElement(streamWriter, 'NetAmount', record.poHeader.netAmount.toFixed(2));
        writeXmlElement(streamWriter, 'AuthAmount', record.poHeader.authAmount.toFixed(2));
        writeXmlElement(streamWriter, 'ChargingShipping', record.poHeader.chargingShipping);
        writeXmlElement(streamWriter, 'ShippingCost', '');
        writeXmlElement(streamWriter, 'ShippingByMGI', '');
        writeXmlElement(streamWriter, 'DutyByMGI', '');
        writeXmlElement(streamWriter, 'InsByMGI', '');
        writeXmlElement(streamWriter, 'DutyInclusive', record.poHeader.dutyInclusive);
        writeXmlElement(streamWriter, 'VATInclusive', record.poHeader.vatInclusive);
        writeXmlElement(streamWriter, 'PaymentMethod', record.poHeader.paymentMethod);
        if (Object.hasOwnProperty.call(record, 'authExpirationDate')) {
          writeXmlElement(streamWriter, 'AuthExpirationDate', record.poHeader.authExpirationDate);
        } else {
          writeXmlElement(streamWriter, 'AuthExpirationDate', moment().add(10, 'days').format('YYYYMMDD'));
        }
        writeXmlElement(streamWriter, 'ConsumerSubTotal', '');
        writeXmlElement(streamWriter, 'ConsumerTotalTax', '');
        writeXmlElement(streamWriter, 'ConsumerTotalDutyAmount', '');
        writeXmlElement(streamWriter, 'ConsumerTotalInsAmount', '');
        writeXmlElement(streamWriter, 'ConsumerGiftCardAmount', '');
        writeXmlElement(streamWriter, 'ConsumerTotalLoyaltyAmount', '');
        writeXmlElement(streamWriter, 'ConsumerNetAmount', '');
        writeXmlElement(streamWriter, 'ConsumerAuthAmount', '');
        writeXmlElement(streamWriter, 'Incoterms', '');
        writeXmlElement(streamWriter, 'ConsTaxByMGI', '');
        writeXmlElement(streamWriter, 'TotalConsTaxByMGI', '');
        writeXmlElement(streamWriter, 'UserField1', '');
        writeXmlElement(streamWriter, 'UserField2', '');
        writeXmlElement(streamWriter, 'UserField3', '');
        writeXmlElement(streamWriter, 'UserField4', '');

        /* Create EcommercePOHeader Elements : end */
        streamWriter.writeEndElement();

        /* Create EcommercePOItem Elements : start */
        record.poItems.forEach(function (poItem) {
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
          writeXmlElement(streamWriter, 'VATEntity', '');
          writeXmlElement(streamWriter, 'CommercialEntity', '');
          writeXmlElement(streamWriter, 'InventoryLocation', poItem.inventoryLocation);
          writeXmlElement(streamWriter, 'GrossValue', poItem.grossValue.toFixed(2));
          writeXmlElement(streamWriter, 'MarkDownAmount', '');
          writeXmlElement(streamWriter, 'PromoCode', (Object.hasOwnProperty.call(poItem, 'promoCode')) ? poItem.promoCode : '');
          writeXmlElement(streamWriter, 'PromoAmount', poItem.promoAmount.toFixed(2));
          writeXmlElement(streamWriter, 'RoundingAmount', '');
          writeXmlElement(streamWriter, 'LoyaltyAmount', '');
          writeXmlElement(streamWriter, 'SubTotal', poItem.subTotal.toFixed(2), true);
          writeXmlElement(streamWriter, 'TaxAmount', poItem.taxAmount.toFixed(2), true);
          writeXmlElement(streamWriter, 'Tax1', poItem.tax1 || 0, true);
          writeXmlElement(streamWriter, 'Tax2', poItem.tax2 || 0, true);
          writeXmlElement(streamWriter, 'Tax3', poItem.tax3 || 0, true);
          writeXmlElement(streamWriter, 'Tax4', poItem.tax4 || 0, true);
          writeXmlElement(streamWriter, 'Tax5', poItem.tax5 || 0, true);
          writeXmlElement(streamWriter, 'Tax6', poItem.tax6 || 0, true);
          writeXmlElement(streamWriter, 'NetAmount', poItem.netAmount.toFixed(2), true);
          writeXmlElement(streamWriter, 'ShippingCost', '');
          writeXmlElement(streamWriter, 'ConsTaxByMGI', '');
          writeXmlElement(streamWriter, 'ConsumerGrossValue', '');
          writeXmlElement(streamWriter, 'ConsumerMarkDownAmount', '');
          writeXmlElement(streamWriter, 'ConsumerPromoAmount', '');
          writeXmlElement(streamWriter, 'ConsumerRoundingAmount', '');
          writeXmlElement(streamWriter, 'ConsumerLoyaltyAmount', '');
          writeXmlElement(streamWriter, 'ConsumerSubTotal', '');
          writeXmlElement(streamWriter, 'ConsumerTaxAmount', '');
          writeXmlElement(streamWriter, 'ConsumerDutyAmount', '');
          writeXmlElement(streamWriter, 'ConsumerInsAmount', '');
          writeXmlElement(streamWriter, 'ConsumerNetAmount', '');

          /* Create EcommercePOItemPersonalization Elements : start */
          if (poItem.personalizations) {
            poItem.personalizations.forEach(function (personalization) {  /* Gift Wrapping / Personalization */
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
    });
  }

  return new Status(Status.OK, 'OK', 'exportFulfillmentOrder finished successfully or no new records found');
}

module.exports.exportFulfillmentOrder = exportFulfillmentOrder;
