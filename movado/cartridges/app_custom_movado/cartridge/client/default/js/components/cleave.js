'use strict';

var Cleave = require('cleave.js');

module.exports = {
    handleCreditCardNumber: function (cardFieldSelector, cardTypeSelector) {
        var cleave = new Cleave(cardFieldSelector, {
            creditCard: true,
            delimiter: '-',
            onCreditCardTypeChanged: function (type) {
                var creditCardTypes = {
                    visa: 'Visa',
                    mastercard: 'Master Card',
                    amex: 'Amex',
                    discover: 'Discover',
                    unknown: 'Unknown'
                };

                var cardType = creditCardTypes[Object.keys(creditCardTypes).indexOf(type) > -1
                    ? type
                    : 'unknown'];
                $(cardTypeSelector).val(cardType);
                $('.card-number-wrapper').attr('data-type', type);
                if (type === 'visa' || type === 'mastercard' || type === 'discover') {
                    $('#securityCode').attr('maxlength', 3);
                } else {
                    $('#securityCode').attr('maxlength', 4);
                }
            }
        });

        $(cardFieldSelector).data('cleave', cleave);
    },

    credeitCardExpiryDate: function (expirationDate) {
        var cleave = new Cleave(expirationDate, {
            date: true,
            datePattern: ['m', 'y']
        });
        $(expirationDate).data('cleave', cleave);
    },
};
