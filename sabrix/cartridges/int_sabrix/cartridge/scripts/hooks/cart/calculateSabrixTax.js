'use strict';

var Site = require('dw/system/Site');
var Status = require('dw/system/Status');
var sabrixTax = require('int_sabrix/cartridge/scripts/init/sabrixTaxSvc.js');
var sabrixTaxHelper = require('*/cartridge/scripts/hooks/cart/sabrixTaxHelper.js');
var HookMgr = require('dw/system/HookMgr');
var Mail = require('dw/net/Mail');
var Resource = require('dw/web/Resource');
var Logger = require('dw/system/Logger');

/**
 * for Send email notification service failure to support team
 * @returns
 */
function sendFalureEmail(message) {
  var mail = new Mail();
  mail.addTo(Site.getCurrent().preferences.custom.sabrixServiceFailureMailTo);
  mail.setFrom(Site.getCurrent().preferences.custom.sabrixServiceFailureMailFrom);
  mail.setSubject(Resource.msg('service.call.content', 'sabrix', null));
  mail.setContent(Resource.msg('service.call.failure', 'sabrix', null) + message);
  mail.send();
}

function checkShippingAddress(basket)	{
  if (basket != empty) {
    var shipment = basket.getDefaultShipment();
    if (!empty(shipment) && !empty(shipment.shippingAddress)) {
      var shippingAddress = shipment.shippingAddress;
      if (shippingAddress && shippingAddress.city && shippingAddress.city != '' && shippingAddress.countryCode.value && shippingAddress.countryCode.value != ''
				&& shippingAddress.postalCode && shippingAddress.postalCode != '' &&
				shippingAddress.stateCode && shippingAddress.stateCode != '') {
        return true;
      }
    } else if (customer.registered && !empty(customer.profile) && !empty(customer.profile.addressBook) && !empty(customer.profile.addressBook.preferredAddress)) {
      var preferredAddress = customer.profile.addressBook.preferredAddress;
      if (preferredAddress && preferredAddress.city && preferredAddress.city != '' && preferredAddress.countryCode.value && preferredAddress.countryCode.value != ''
				&& preferredAddress.address1 && preferredAddress.address1 != '' && preferredAddress.postalCode && preferredAddress.postalCode != '' &&
				preferredAddress.stateCode && preferredAddress.stateCode != '') {
        return true;
      }
    }
  }
  return false;
}

/**
 * the calculateTax method calls the tax service if sabrixEnable is ON and basket is available
 * @param basket
 * @returns
 */
function calculateTax(basket) {
//	var shipment = basket.getDefaultShipment();

  var taxService;
  if (Site.getCurrent().preferences.custom.sabrixEnable && basket && checkShippingAddress(basket)) {
    taxService = sabrixTax.getTaxService();
    var result = taxService.call(basket);
    var statusMessage;
    if (!result) {
      statusMessage = 'service resulted in empty response';
      sendFalureEmail(statusMessage);
      sabrixTaxHelper.clearSabrixLineTaxAttributes(taxService);
      session.privacy.taxError = true; //[MSS-1345] if service returns error we need to call it again just before Amazon Update Checkout
      return new Status(Status.ERROR);
    } else if (result.status == 'SERVICE_UNAVAILABLE') {
      statusMessage = result.errorMessage;
      sendFalureEmail(statusMessage);
      sabrixTaxHelper.clearSabrixLineTaxAttributes(taxService);
      HookMgr.callHook('dw.order.calculateSfraTax', 'calculateTax', basket);
      session.privacy.taxError = true;
      return new Status(Status.ERROR);
    } else if (result.status == 'ERROR') {
      statusMessage = result.errorMessage;
      sendFalureEmail(statusMessage);
      sabrixTaxHelper.clearSabrixLineTaxAttributes(taxService);
      HookMgr.callHook('dw.order.calculateSfraTax', 'calculateTax', basket);
      session.privacy.taxError = true;
      return new Status(Status.ERROR);
    }
    try {
      var responseWrapper = sabrixTaxHelper.updateLineItemSabrixTax(result, taxService);
      sabrixTaxHelper.populateTaxBreakupInSFCC(responseWrapper);
      Logger.getLogger('SabrixTaxHelper').debug('Tax successfully updated in basket : ');
      delete session.privacy.taxError;
      return new Status(Status.OK);
    } catch (e) {
			/* clear line tax attributes as service resulted in error */
      sabrixTaxHelper.clearSabrixLineTaxAttributes(taxService);
      Logger.getLogger('SabrixTaxHelper').debug('Error occured while updating tax in order with error log : ' + e);
      session.privacy.taxError = true;
      return new Status(Status.ERROR);
    }
  }
  sabrixTaxHelper.clearSabrixLineTaxAttributes(taxService);
  HookMgr.callHook('dw.order.calculateSfraTax', 'calculateTax', basket);
}


module.exports.calculateTax = calculateTax;

