'use strict';

var expressCheckoutRegexs = {};

expressCheckoutRegexs.firstName = new RegExp("^[^(\\'\\&lt;\\>\\\)]+$");
expressCheckoutRegexs.lastName = new RegExp("^[^(\\'\\&lt;\\>\\\)]+$");
expressCheckoutRegexs.email = new RegExp("^[a-z0-9][-a-z0-9.!#$%&amp;'*+-=?^_`{|}~\/]+@([-a-z0-9]+\.)+[a-z]{2,5}$");
expressCheckoutRegexs.companyName = new RegExp("(^[^(\\'\\&lt;\\>\\\)]+$)");
expressCheckoutRegexs.address1 = new RegExp("(^((?!(([\\'\\\\\\>\\&lt;])|(\b(?:[pP](?:[oO][sS][tT](?:[aA][lL])?)?[\.\-\s]*(?:(?:[oO](?:[fF][fF][iI][cC][eE])?[\.\-\s]*)?[bB](?:[oO][xX]|[iI][nN]|\b|\d)|[oO](?:[fF][fF][iI][cC][eE])(?:[-\s]*)|[cC][oO][dD][eE]))))).)*$)");
expressCheckoutRegexs.postalCode = new RegExp("(^[a-zA-Z0-9 ]+$)");
expressCheckoutRegexs.city = new RegExp("(^[^(\\'\\&lt;\\>\\\)]+$)");
expressCheckoutRegexs.phone = new RegExp("^[0-9\\s-]+$");

module.exports = expressCheckoutRegexs;