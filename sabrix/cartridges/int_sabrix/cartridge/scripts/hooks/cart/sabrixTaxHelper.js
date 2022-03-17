/* eslint-disable space-before-blocks */
var HashMap = require('dw/util/HashMap');
var Site = require('dw/system/Site');
var Calendar = require('dw/util').Calendar;
var StringUtils = require('dw/util').StringUtils;
var ProductLineItem = require('dw/order/ProductLineItem');
var ShippingLineItem = require('dw/order/ShippingLineItem');
var Resource = require('dw/web/Resource');
var System = require('dw/system/System');
var Transaction = require('dw/system/Transaction');

/**
 * prepare Sabrix SOAP service request object
 * @param :basket
 * @param :svc
 */
function createSabrixRequestObject(basket, svc){
	//	setup the settings here so we only have to do it once.
  var shipFromAddress1 = Site.getCurrent().preferences.custom.sabrixShipFromAddress1;
  var shipFromAddress2 = Site.getCurrent().preferences.custom.sabrixShipFromAddress2;
  var shipFromCity = Site.getCurrent().preferences.custom.sabrixShipFromCity;
  var shipFromStateCode = Site.getCurrent().preferences.custom.sabrixShipFromStateCode;
  var shipFromPostalCode = Site.getCurrent().preferences.custom.sabrixShipFromPostalCode;
  var shipFromCountryCode = Site.getCurrent().preferences.custom.sabrixShipFromCountryCode;
  var externalCompanyId = Site.getCurrent().preferences.custom.sabrixExternalCompanyId;


	// store reference to all the line items sent so we can associate them back in the reponse
  var itemMap;
  var orderOrBasket;

  svc.orderOrBasket = null;
  svc.orderOrBasket = basket;

  svc.itemMap = new HashMap();

	// required to have an order or basket
  if (empty(svc.orderOrBasket)){
    throw new Error(Resource.msg('service.call.failure', 'sabrix', null) + svc.orderOrBasket);
  }
  if (System.instanceType == System.PRODUCTION_SYSTEM){
    svc.webReference = webreferences2.TaxCalculationServicePRD;
  } else {
    svc.webReference = webreferences2.TaxCalculationServiceTest;
  }
  var taxRequest = new svc.webReference.TaxCalculationRequest();
  var indata = new svc.webReference.IndataType();
  indata.version = svc.webReference.VersionType.G;

  var callingSystemNumber = Site.getCurrent().preferences.custom.sabrixCallingSystemNumber;
  indata.setCALLINGSYSTEMNUMBER(callingSystemNumber);

  var companyRole = Site.getCurrent().preferences.custom.sabrixCompanyRole;
  indata.setCOMPANYROLE(companyRole);


  var externalCompanyId = Site.getCurrent().preferences.custom.sabrixExternalCompanyId;
  indata.setEXTERNALCOMPANYID(externalCompanyId);

  var hostRequestInfo = new svc.webReference.HostRequestInfoType();

  var hostRequestID = Site.getCurrent().preferences.custom.sabrixHostRequestID;
  hostRequestInfo.setHOSTREQUESTID(hostRequestID);

  var hostRequestLogEntryID = Site.getCurrent().preferences.custom.sabrixHostRequestLogEntryID;
  hostRequestInfo.setHOSTREQUESTLOGENTRYID(hostRequestLogEntryID);

  indata.setHOSTREQUESTINFO(hostRequestInfo);

  var invoice = new svc.webReference.IndataInvoiceType();
  invoice.setEXTERNALCOMPANYID(externalCompanyId);

  var companyRole = Site.getCurrent().preferences.custom.sabrixCompanyRole;
  invoice.setCOMPANYROLE(companyRole);

  var currencyCode = Site.getCurrent().preferences.custom.sabrixCurrencyCode;
  invoice.setCURRENCYCODE(currencyCode);

  var transactionType = Site.getCurrent().preferences.custom.sabrixTransactionType;
  invoice.setTRANSACTIONTYPE(transactionType);

  var isAudited = Site.getCurrent().preferences.custom.sabrixIsAudited;
  invoice.setISAUDITED(isAudited);

  var isCredit = Site.getCurrent().preferences.custom.sabrixIsCredit;
  invoice.setISCREDIT(isCredit);

  var calendar = new Calendar();
  var invoiceDate = StringUtils.formatCalendar(calendar, 'MM/dd/YYYY');
  invoice.setINVOICEDATE(invoiceDate);

	// Addresses Start
  var shipFromAddress = new svc.webReference.ZoneAddressType();

  shipFromAddress.setCITY(shipFromCity);
  shipFromAddress.setCOUNTRY(shipFromCountryCode);
  shipFromAddress.setSTATE(shipFromStateCode);
  shipFromAddress.setADDRESS1(shipFromAddress1);
  shipFromAddress.setADDRESS2(shipFromAddress2);
  shipFromAddress.setPOSTCODE(shipFromPostalCode);
  invoice.setSHIPFROM(shipFromAddress);
	// addresses.setShipFromAddress(shipFromAddress);

	// Get the customer address from the default shipment
  var shipment = svc.orderOrBasket.getDefaultShipment();
  var sa;
  if (shipment){
    sa = shipment.shippingAddress;
  }
  if (!sa && customer.registered && customer.profile && customer.profile.addressBook.preferredAddress)		{ sa = customer.profile.addressBook.preferredAddress; }
  if (sa && sa.postalCode){
    var shipToAddress = new svc.webReference.ZoneAddressType();
    shipToAddress.setCOUNTRY(sa.countryCode);
    shipToAddress.setSTATE(sa.stateCode);
    shipToAddress.setCITY(sa.city);
    shipToAddress.setADDRESS1(sa.address1);

    if (!empty(sa.address2)){
      shipToAddress.setADDRESS2(sa.address2);
    }

    if (sa.postalCode && sa.postalCode.length > 5) {
      var postalCodeSplit = sa.postalCode.split('-');
      shipToAddress.setPOSTCODE(postalCodeSplit[0]);
      shipToAddress.setGEOCODE(postalCodeSplit[1]);
    } else {
      shipToAddress.setPOSTCODE(sa.postalCode);
    }
    invoice.setSHIPTO(shipToAddress);
  }

	// Addresses End
  var lines = invoice.LINE;
  var i = 1;

	// for all line items on the order
  var lineUOM = Site.getCurrent().preferences.custom.sabrixLineQuantityUOM;
  var lineItemTaxDeafultTaxClassID = Site.getCurrent().preferences.custom.sabrixLineItemTaxClass;
  var shippingLineItemDefaultTaxClassID = Site.getCurrent().preferences.custom.sabrixShippingLineItemTaxClass;
  var paidShippingTaxClassID = Site.getCurrent().preferences.custom.sabrixPaidShippingTaxClass;
  var linePointOfTransfer = Site.getCurrent().preferences.custom.sabrixLinePointOfTitleTransfer;
  var lineIsExempt = Site.getCurrent().preferences.custom.sabrixLineIsExempt;
  for (var i = 0; i < svc.orderOrBasket.allLineItems.length; i++){
    var lineItem = svc.orderOrBasket.allLineItems[i];
    svc.itemMap.put(i.toFixed(), lineItem);
    var line = new svc.webReference.IndataLineType();

    line.setLINENUMBER(i);
    
    // Custom Start: make the price conditional, added the adjustedPrice to avoid the negative tax possibility  [MSS-992]
    if (lineItem instanceof dw.order.PriceAdjustment) {
      line.setGROSSAMOUNT(lineItem.basePrice.value);
    } else {
      line.setGROSSAMOUNT(lineItem.adjustedPrice.value);
    }
    // Custom End

    if (lineItem instanceof ProductLineItem) {
      line.setQUANTITY(lineItem.quantityValue);
      line.setUOM(lineUOM);

      if (lineItem.optionProductLineItem){
        line.ID = lineItem.optionID + '-' + lineItem.optionValueID;
      } else {
        line.ID = lineItem.productID;
      }

      var taxClass = lineItem.taxClassID;
      if (empty(taxClass)){
        taxClass = lineItemTaxDeafultTaxClassID;
      }
      line.setPRODUCTCODE(taxClass);
    } else if (lineItem instanceof ShippingLineItem) {
      line.setQUANTITY(1);
      line.setUOM(lineUOM);
      line.ID = lineItem.ID;
      var taxClass = lineItem.taxClassID;
      if (empty(taxClass)) {
        taxClass = shippingLineItemDefaultTaxClassID;
      }
      if(lineItem.adjustedPrice.value > 0) {
        taxClass = paidShippingTaxClassID;
      }
      line.setPRODUCTCODE(taxClass);
    } else {
      line.setQUANTITY(lineItem.quantity); //
      line.setUOM(lineUOM);
      line.ID = lineItem.promotionID;
      line.setGROSSAMOUNT(lineItem.basePrice.value);
			// todo: Map productcode to tax classes on products
      var taxClass = lineItem.taxClassID;
      if (empty(taxClass)){
        taxClass = lineItemTaxDeafultTaxClassID;
      }
      // Custom Start: Get the tax class from site preference in case of adjustment to avoid the negative tax possibility [MSS-992]
      var priceAdjustmentTaxClass = Site.getCurrent().preferences.custom.priceAdjustmentTaxClass;
      if (priceAdjustmentTaxClass) {
        taxClass = priceAdjustmentTaxClass;
      }
      // Custom End
      line.setPRODUCTCODE(taxClass);
    }
    line.setISCREDIT(isCredit);
    var isExempt = new svc.webReference.FlagAddressType();
    isExempt.setALL(lineIsExempt);
    line.setISEXEMPT(isExempt);
    line.setPOINTOFTITLETRANSFER(linePointOfTransfer);

    lines.add(line);
  }
	// end looping line items
  indata.getINVOICE().add(invoice);
  taxRequest.setINDATA(indata);
  return taxRequest;
}


/**
 * populates the city and district map based on response returned from Sabrix
 * @param line
 * @returns
 */
function getCityAndDistrictMap(line){
  var defaultCity,
    defaultDistrict;
  var cityDistrictMap = new HashMap();
  var cityPopulatedFlag = false;
  var districtPopulatedFlag = false;
  var defaultCityPopulatedInMap = false;
  var defaultDistrictPopulatedInMap = false;

  for (var k = 0; k < line.TAX.length; k++){
    var tax = line.TAX[k];

		/* get default city name*/
    if (!cityPopulatedFlag && tax.EFFECTIVEZONELEVEL && tax.EFFECTIVEZONELEVEL == Resource.msg('tax.EFFECTIVEZONELEVEL.city', 'sabrix', null) && tax.ZONENAME){
      defaultCity = tax.ZONENAME;
      cityPopulatedFlag = true;
    }
		/* get default district name*/
    if (!districtPopulatedFlag && tax.EFFECTIVEZONELEVEL && tax.EFFECTIVEZONELEVEL == Resource.msg('tax.EFFECTIVEZONELEVEL.District', 'sabrix', null) && tax.ZONENAME){
      defaultDistrict = tax.ZONENAME;
      districtPopulatedFlag = true;
    }

    if (tax.EFFECTIVEZONELEVEL && tax.EFFECTIVEZONELEVEL == Resource.msg('tax.EFFECTIVEZONELEVEL.city', 'sabrix', null)){
      if (!defaultCityPopulatedInMap && defaultCity == tax.ZONENAME){
        cityDistrictMap.put(Resource.msg('tax.EFFECTIVEZONELEVEL.city', 'sabrix', null), parseFloat(tax.TAXAMOUNT.AUTHORITYAMOUNT));
        defaultCityPopulatedInMap = true;
      } else {
        var taxAmount = cityDistrictMap.get(Resource.msg('tax.EFFECTIVEZONELEVEL.AdditionalCity', 'sabrix', null));
        if (taxAmount){
          var totalAmount = taxAmount + parseFloat(tax.TAXAMOUNT.AUTHORITYAMOUNT);
          cityDistrictMap.put(Resource.msg('tax.EFFECTIVEZONELEVEL.AdditionalCity', 'sabrix', null), totalAmount);
        } else {
          cityDistrictMap.put(Resource.msg('tax.EFFECTIVEZONELEVEL.AdditionalCity', 'sabrix', null), parseFloat(tax.TAXAMOUNT.AUTHORITYAMOUNT));
        }
      }
    } else if (tax.EFFECTIVEZONELEVEL && tax.EFFECTIVEZONELEVEL == Resource.msg('tax.EFFECTIVEZONELEVEL.District', 'sabrix', null)){
      if (!defaultDistrictPopulatedInMap && defaultDistrict == tax.ZONENAME){
        cityDistrictMap.put(Resource.msg('tax.EFFECTIVEZONELEVEL.District', 'sabrix', null), parseFloat(tax.TAXAMOUNT.AUTHORITYAMOUNT));
        defaultDistrictPopulatedInMap = true;
      } else {
        var taxAmount = cityDistrictMap.get(Resource.msg('tax.EFFECTIVEZONELEVEL.AdditionalDistrict', 'sabrix', null));
        if (taxAmount){
          var totalAmount = taxAmount + parseFloat(tax.TAXAMOUNT.AUTHORITYAMOUNT);
          cityDistrictMap.put(Resource.msg('tax.EFFECTIVEZONELEVEL.AdditionalDistrict', 'sabrix', null), totalAmount);
        } else {
          cityDistrictMap.put(Resource.msg('tax.EFFECTIVEZONELEVEL.AdditionalDistrict', 'sabrix', null), parseFloat(tax.TAXAMOUNT.AUTHORITYAMOUNT));
        }
      }
    }
  }
  return cityDistrictMap;
}


/**
 * populate the tax break up in PLI
 * @param id
 * @param countyTotal
 * @param stateTotal
 * @param cityTotal
 * @param additionalCityTotal
 * @param districtTotal
 * @param additionalDistrictTotal
 * @param currentBasket
 */
function populatePLIAttributes(line, countyTotal, stateTotal, cityTotal, additionalCityTotal, districtTotal, additionalDistrictTotal, currentBasket) {
  var allLineItems = currentBasket.allLineItems;
  var productLineItem = require('dw/order/ProductLineItem');
  for (var i = 0; i < allLineItems.length; i++){
    var productItem = allLineItems[i];
    var prodId;
    if (productItem instanceof productLineItem){
      if (productItem.optionProductLineItem){
        prodId = productItem.optionID + '-' + productItem.optionValueID;
      } else {
        prodId = productItem.productID;
      }

      if (line.ID == prodId && i == line.LINENUMBER){
        Transaction.wrap(function () {
          productItem.custom.sabrixCountyTotal = countyTotal;
          productItem.custom.sabrixStateTotal = stateTotal;
          productItem.custom.sabrixCityTotal = cityTotal;
          productItem.custom.sabrixAdditionalCityTotal = additionalCityTotal;
          productItem.custom.sabrixDistrictTotal = districtTotal;
          productItem.custom.sabrixAdditionalDistrictTotal = additionalDistrictTotal;
        });
      }
    }
  }
}


/**
 * populate the tax break up in Price Adjustment
 * @param id
 * @param countyTotal
 * @param stateTotal
 * @param cityTotal
 * @param additionalCityTotal
 * @param districtTotal
 * @param additionalDistrictTotal
 * @param currentBasket
 */
function populatePriceAdjustmentsTaxBreakup(line, countyTotal, stateTotal, cityTotal, additionalCityTotal, districtTotal, additionalDistrictTotal, currentBasket){
  var PriceAdjustment = require('dw/order/PriceAdjustment');

  for (var i = 0; i < currentBasket.allLineItems.length; i++){
    var lineItem = currentBasket.allLineItems[i];
    if (lineItem instanceof PriceAdjustment && line.ID == lineItem.promotionID && i == line.LINENUMBER){
      Transaction.wrap(function () {
        lineItem.custom.sabrixCountyTotal = Math.abs(countyTotal);
        lineItem.custom.sabrixStateTotal = Math.abs(stateTotal);
        lineItem.custom.sabrixCityTotal = Math.abs(cityTotal);
        lineItem.custom.sabrixAdditionalCityTotal = Math.abs(additionalCityTotal);
        lineItem.custom.sabrixDistrictTotal = Math.abs(districtTotal);
        lineItem.custom.sabrixAdditionalDistrictTotal = Math.abs(additionalDistrictTotal);
      });
    }
  }
}


/**
 * populate the tax break up in SLI
 * @param id
 * @param countyTotal
 * @param stateTotal
 * @param cityTotal
 * @param additionalCityTotal
 * @param districtTotal
 * @param additionalDistrictTotal
 * @param currentBasket
 */

function populateSLIAttributes(id, countyTotal, stateTotal, cityTotal, additionalCityTotal, districtTotal, additionalDistrictTotal, currentBasket){
  var allShipments = currentBasket.getShipments();

	// added to comment to review in build

  for (var i = 0; i < allShipments.length; i++){
    var shipment = allShipments[i];
    for (var z = 0; z < shipment.shippingLineItems.length; z++) {
      var shippingItem = shipment.shippingLineItems[i];
      if (id == shippingItem.ID){
        Transaction.wrap(function () {
          shippingItem.custom.sabrixCountyTotal = countyTotal;
          shippingItem.custom.sabrixStateTotal = stateTotal;
          shippingItem.custom.sabrixCityTotal = cityTotal;
          shippingItem.custom.sabrixAdditionalCityTotal = additionalCityTotal;
          shippingItem.custom.sabrixDistrictTotal = districtTotal;
          shippingItem.custom.sabrixAdditionalDistrictTotal = additionalDistrictTotal;
        });
      }
    }
  }
}


/**
 *
 * @param taxService
 * @returns
 */
function clearSabrixLineTaxAttributes(taxService){
  var basket;
  var allLineItems;
  var lineItem;
  var BasketMgr = require('dw/order/BasketMgr');

  if (taxService){
		 basket = taxService.orderOrBasket;
  } else {
    basket = BasketMgr.getCurrentBasket();
  }

  if (basket){
    allLineItems = basket.allLineItems;
    for (var i = 0; i < allLineItems.length; i++){
      lineItem = allLineItems[i];
      Transaction.wrap(function (){
        lineItem.custom.sabrixCountyTotal = 0;
        lineItem.custom.sabrixStateTotal = 0;
        lineItem.custom.sabrixCityTotal = 0;
        lineItem.custom.sabrixAdditionalCityTotal = 0;
        lineItem.custom.sabrixDistrictTotal = 0;
        lineItem.custom.sabrixAdditionalDistrictTotal = 0;
      });
      lineItem.updateTax(0); //This is added; due to fail of sabrix service discount was not applied to orderTotal
    }
  }
}


/**
 * parses the response and utilise the Attributes in SFCC PLI
 * @param reponseWrapper
 * @returns
 */
function populateTaxBreakupInSFCC(reponseWrapper){
  var responseObj = reponseWrapper.responseObject.OUTDATA.INVOICE[0];
  var BasketMgr = require('dw/order/BasketMgr');
  var currentBasket = BasketMgr.getCurrentBasket();

  for (var i = 0; i < responseObj.LINE.length; i++){
    var countyTotal = 0.0;
    var stateTotal = 0.0;
    var cityTotal = 0.0;
    var additionalCityTotal = 0.0;
    var districtTotal = 0.0;
    var additionalDistrictTotal = 0.0;

    var line = responseObj.LINE[i];

		/* get city and district total map*/
    var cityDistrictMap = getCityAndDistrictMap(line);

    for (var k = 0; k < line.TAX.length; k++){
      var tax = line.TAX[k];

      if (tax.EFFECTIVEZONELEVEL && tax.EFFECTIVEZONELEVEL == Resource.msg('tax.EFFECTIVEZONELEVEL.state', 'sabrix', null)){
        if (tax.TAXAMOUNT.AUTHORITYAMOUNT){
          stateTotal += parseFloat(tax.TAXAMOUNT.AUTHORITYAMOUNT);
        }
      }			else if (tax.EFFECTIVEZONELEVEL && tax.EFFECTIVEZONELEVEL == Resource.msg('tax.EFFECTIVEZONELEVEL.county', 'sabrix', null)){
        if (tax.TAXAMOUNT.AUTHORITYAMOUNT){
          countyTotal += parseFloat(tax.TAXAMOUNT.AUTHORITYAMOUNT);
        }
      }			else if (tax.EFFECTIVEZONELEVEL && tax.EFFECTIVEZONELEVEL == Resource.msg('tax.EFFECTIVEZONELEVEL.city', 'sabrix', null)){
        if (cityDistrictMap.get(Resource.msg('tax.EFFECTIVEZONELEVEL.city', 'sabrix', null))){
          cityTotal = cityDistrictMap.get(Resource.msg('tax.EFFECTIVEZONELEVEL.city', 'sabrix', null));
        }
        if (cityDistrictMap.get(Resource.msg('tax.EFFECTIVEZONELEVEL.AdditionalCity', 'sabrix', null))){
          additionalCityTotal = cityDistrictMap.get(Resource.msg('tax.EFFECTIVEZONELEVEL.AdditionalCity', 'sabrix', null));
        }
      }			else if (tax.EFFECTIVEZONELEVEL && tax.EFFECTIVEZONELEVEL == Resource.msg('tax.EFFECTIVEZONELEVEL.District', 'sabrix', null)){
        if (cityDistrictMap.get(Resource.msg('tax.EFFECTIVEZONELEVEL.District', 'sabrix', null))){
          districtTotal = cityDistrictMap.get(Resource.msg('tax.EFFECTIVEZONELEVEL.District', 'sabrix', null));
        }
        if (cityDistrictMap.get(Resource.msg('tax.EFFECTIVEZONELEVEL.AdditionalDistrict', 'sabrix', null))){
          additionalDistrictTotal = cityDistrictMap.get(Resource.msg('tax.EFFECTIVEZONELEVEL.AdditionalDistrict', 'sabrix', null));
        }
      }
    }

		/* populate PLI cusom attributes*/
    populatePLIAttributes(line, countyTotal, stateTotal, cityTotal, additionalCityTotal, districtTotal, additionalDistrictTotal, currentBasket);
    populateSLIAttributes(line.ID, countyTotal, stateTotal, cityTotal, additionalCityTotal, districtTotal, additionalDistrictTotal, currentBasket);
    populatePriceAdjustmentsTaxBreakup(line, countyTotal, stateTotal, cityTotal, additionalCityTotal, districtTotal, additionalDistrictTotal, currentBasket);
  }
}


/**
 * parse the service response
 * update tax information in basket
 * @param : responseObject
 * @param : svc
 */
function updateLineItemSabrixTax(responseObject, svc){
  var responseWrapper = {};
  var money = require('dw/value/Money');

  var status = responseObject.object.OUTDATA.REQUESTSTATUS;

  responseWrapper.responseObject = responseObject.object;

  responseWrapper.status = status.ISSUCCESS;

  if (!status.ISSUCCESS){
    if (status && status.ERROR && status.ERROR && status.ERROR.length > 0 && status.ERROR[0].CODE){
      responseWrapper.code = status.ERROR[0].CODE;
    }
    if (status && status.ERROR && status.ERROR && status.ERROR.length > 0 && status.ERROR[0].DESCRIPTION){
      responseWrapper.description = status.ERROR[0].DESCRIPTION;
    }
  }

	// responseWrapper.taxDocument = responseObject.taxDocumuments.taxDocument
	// parse out the tax rates and apply to the line items etc.

  var outputInvoices = responseObject.object.OUTDATA.INVOICE;

  for (var i = 0; i < outputInvoices.length; i++){
    var invoice = outputInvoices[i];

    for (var k = 0; k < invoice.LINE.length; k++){
      var line = invoice.LINE[k];
      var itemMap = svc.itemMap;
      var lineItem = itemMap.get(new Number(line.LINENUMBER).toFixed());
      var rate = line.TAXSUMMARY.TAX_RATE;

			/* var basis = line.TAXSUMMARY.TAXABLEBASIS;
			var taxAmount =  new money(Number(line.TOTALTAXAMOUNT),invoice.CURRENCYCODE.toString());
			var taxbasis =  new money(Number(line.TAXSUMMARY.TAXABLEBASIS),invoice.CURRENCYCODE.toString());
			lineItem.updateTaxAmount(taxAmount);*/

			// set the tax rate on each line item
			// rate * 1 converts to number, otherwise won't work
      lineItem.updateTax(rate * 1);
    }
  }

  svc.orderOrBasket.updateTotals();
  return responseWrapper;
}


exports.createSabrixRequestObject = createSabrixRequestObject;
exports.updateLineItemSabrixTax = updateLineItemSabrixTax;
exports.populateTaxBreakupInSFCC = populateTaxBreakupInSFCC;
exports.clearSabrixLineTaxAttributes = clearSabrixLineTaxAttributes;
