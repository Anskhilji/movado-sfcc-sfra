$('button[value="submit-payment"]').on('click', function (e) {
    if ($('#selectedPaymentOption').val() == 'CREDIT_CARD') {
        var cardData;
        var options = {};
        var masked = '';

        if (!$('.payment-information').data('is-new-payment')) {
            $('#selectedCardID').val($('.selected-payment').data('uuid'));
            cardData = getCardData(true);
            $('#originalCardNumber').val(cardData.number);
            options = { enableValidations: false };
        } else {
            $('#selectedCardID').val('');
            cardData = getCardData(false);
            $('#originalCardNumber').val(cardData.number);
            masked = maskValue(cardData.number.replace(/\s/g, ''));
        }

        var validCard = encryptData(cardData, options);
        if (!validCard) {
            var scrollUtil = require('./utilities/scrollUtil');
            scrollUtil.scrollInvalidFields('.payment-form .payment-options', -80, 300);
            return false;
        }
        $('#creditBin').val($('#cardNumber').val().split(' ').join('').substring(0, 6));
        $('#cardNumber').val(masked);
    }
});

$('button[value="add-new-payment"]').on('click', function (e) {
    var cardData = getCardData(false);
    var options = { enableValidations: true };
    encryptData(cardData, options);
});

function getCardData(selectedCard) {
    var cardData = {};
    if (!selectedCard) {
        cardData.number = $('#cardNumber').val();
        cardData.holderName = $('#holderName').val();
        cardData.expiryMonth = $('#expirationMonth').val();
        cardData.expiryYear = $('#expirationYear').val();
        cardData.cvc = $('#securityCode').val();
    } else {
        cardData.cvc = $('.selected-payment #saved-payment-security-code').val();
    }
    return cardData;
}

function encryptData(cardData, options) {
    var encryptedData = $('#adyenEncryptedData');
    var encryptedDataValue;
    var cseInstance = adyen.createEncryption(options);
    var validationResult = cseInstance.validate(cardData);
    $('#invalidCardDetails').hide();
    if (!validationResult.valid) {
        showValidation(validationResult);
        return false;
    }

    cardData.generationtime = $('#adyen_generationtime').val();
    encryptedDataValue = cseInstance.encrypt(cardData);
    encryptedData.val(encryptedDataValue);
    return true;
}

function showValidation(validationResult) {
    clearValidations();
    for (var key in validationResult) {
        if (validationResult[key] === false) {
            switch (key) {
                case 'holderName':
                    $('#holderName').addClass('is-invalid');
                    break;
                case 'number':
                    $('#cardNumber').addClass('is-invalid');
                    break;
                case 'expiryMonth':
                    $('#expirationMonth').addClass('is-invalid');
                    break;
                case 'expiryYear':
                    $('#expirationYear').addClass('is-invalid');
                    break;
                case 'cvc':
                    $('#securityCode').addClass('is-invalid');
                    break;
                default:
                    break;
            }
        }
    }
    $('#invalidCardDetails').show();
}

function clearValidations() {
    $('#holderName').removeClass('is-invalid');
    $('#cardNumber').removeClass('is-invalid');
    $('#expirationMonth').removeClass('is-invalid');
    $('#expirationYear').removeClass('is-invalid');
    $('#securityCode').removeClass('is-invalid');
}

function maskValue(value) {
    if (value && value.length > 4) {
        return value.replace(/\d(?=\d{4})/g, '*');
    }
    return '';
}

