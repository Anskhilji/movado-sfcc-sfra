'use strict';

var checkoutFieldsRegex = {};

checkoutFieldsRegex.firstName = new RegExp("^[^(\\'\\\\>\\\)]+$");
checkoutFieldsRegex.lastName = new RegExp("^[^(\\'\\\\>\\\)]+$");
checkoutFieldsRegex.email = /^(?=[a-zA-Z0-9_-]{1,64}(?!.*?\.\.)+(?!\@)+[a-zA-Z0-9!.#$%&;'*+-=?^_`{|}~\S+-]{1,64})+[^\@\s]{1,64}[^\@\.\s-]+@[^\-\.][a-zA-Z0-9\.-]+[\.]+(?!.*web|.*'')[a-zA-Z0-9\.]{2,6}[^\-\.@]$/;
checkoutFieldsRegex.companyName = new RegExp("(^[^(\\'\\\\>\\\)]+$)");
checkoutFieldsRegex.address1 = new RegExp("(^((?!(([\\'\\\\\\>\\;])|(\b(?:[pP](?:[oO][sS][tT](?:[aA][lL])?)?[\.\-\s]*(?:(?:[oO](?:[fF][fF][iI][cC][eE])?[\.\-\s]*)?[bB](?:[oO][xX]|[iI][nN]|\b|\d)|[oO](?:[fF][fF][iI][cC][eE])(?:[-\s]*)|[cC][oO][dD][eE]))))).)*$)");
checkoutFieldsRegex.postalCode = new RegExp("(^[a-zA-Z0-9 ]{4,10})");
checkoutFieldsRegex.city = new RegExp("(^[^(\\'\\\\>\\\)]+$)");
checkoutFieldsRegex.phone = new RegExp("(^[0-9 +\\s-]{8,20})");

module.exports = checkoutFieldsRegex;