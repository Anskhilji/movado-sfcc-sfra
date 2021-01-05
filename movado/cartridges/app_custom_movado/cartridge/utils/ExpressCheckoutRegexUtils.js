'use strict';

var checkoutFieldsRegex = {};

checkoutFieldsRegex.firstName = new RegExp("^[^(\\'\\&lt;\\>\\\)]+$");
checkoutFieldsRegex.lastName = new RegExp("^[^(\\'\\&lt;\\>\\\)]+$");
checkoutFieldsRegex.email = new RegExp("^[a-z0-9][-a-z0-9.!#$%&amp;'*+-=?^_`{|}~\/]+@([-a-z0-9]+\.)+[a-z]{2,5}$");
checkoutFieldsRegex.companyName = new RegExp("(^[^(\\'\\&lt;\\>\\\)]+$)");
checkoutFieldsRegex.address1 = new RegExp("(^((?!(([\\'\\\\\\>\\&lt;])|(\b(?:[pP](?:[oO][sS][tT](?:[aA][lL])?)?[\.\-\s]*(?:(?:[oO](?:[fF][fF][iI][cC][eE])?[\.\-\s]*)?[bB](?:[oO][xX]|[iI][nN]|\b|\d)|[oO](?:[fF][fF][iI][cC][eE])(?:[-\s]*)|[cC][oO][dD][eE]))))).)*$)");
checkoutFieldsRegex.postalCode = new RegExp("(^[a-zA-Z0-9 ]+$)");
checkoutFieldsRegex.city = new RegExp("(^[^(\\'\\&lt;\\>\\\)]+$)");
checkoutFieldsRegex.phone = new RegExp("^[0-9\\s-]+$");

module.exports = checkoutFieldsRegex;