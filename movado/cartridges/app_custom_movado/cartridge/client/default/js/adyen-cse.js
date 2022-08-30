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
            //MSS-1649 Payment Methods Selection Redesign we don't need scrool
            // on Eroor and payment method because Of Payment Methods tabs wrapped
            // in a container and not scrool too much.
            // var scrollUtil = require('./utilities/scrollUtil');
            // scrollUtil.scrollInvalidFields('.payment-options', -80, 300);
            return false;
        }
        $('#creditBin').val($('#cardNumber').val().split('-').join('').substring(0, 6));
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
        var creditCardDate = creditCardDateValidation();
        cardData.number = $('#cardNumber').val();
        cardData.holderName = $('#holderName').val();
        cardData.expiryMonth = $('#expirationMonth').val();
        if (creditCardDate) {
            cardData.expiryYear = $('#expirationYear').val();
        } else {
            cardData.expiryYear = false;
        }
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
    validationResult =  customCardValidation(cardData,validationResult);
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
function customCardValidation(cardData, validationResult) {
    var nameRegex = new RegExp("^[a-z|A-Z]+(?: [a-z|A-Z]+)*$");
    if (!nameRegex.test(cardData.holderName)){
        validationResult.holderName=false;
    }
    return validationResult;
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
                    $('#expirationDate').addClass('is-invalid');
                    break;
                case 'expiryYear':
                    $('#expirationDate').addClass('is-invalid');
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
    $('#expirationDate').removeClass('is-invalid');
    $('#securityCode').removeClass('is-invalid');
}

function maskValue(value) {
    if (value && value.length > 4) {
        return value.replace(/\d(?=\d{4})/g, '*');
    }
    return '';
}

function creditCardDateValidation() {
    var creditCardDate = $('#expirationDate').val().split('/');
    var expdateRegex = new RegExp("^[[2-9]{1}]?([0-9]{1})$");
    var cuurentDate = new Date();
    const d = new Date();
    let currentMonth = d.getMonth() +1;
    var currentYear = cuurentDate.getFullYear().toString();

    if (!expdateRegex.test(creditCardDate[1]) || ((currentYear.substring(0,2) + creditCardDate[1] <= currentYear) && parseInt(creditCardDate[0]) < currentMonth)){
        $('#expirationDate').addClass('is-invalid');
        return false;
    } else {
        return true;
    }
}



$(document).ready(function(){
    
    $("input").change(function(){
        var creditCardDate = $('#expirationDate').val().split('/');
        $("#expirationMonth").val(parseInt(creditCardDate[0]));
    });

    $("input").change(function(){
        var creditCardDate = $('#expirationDate').val().split('/');
        var cuurentDate = new Date();
        var currentYear = cuurentDate.getFullYear().toString();
        var cruuentDate = currentYear.substring(0,2);
        var selectedCreditCardYear = cruuentDate + creditCardDate[1];
        $("#expirationYear").val(parseInt(selectedCreditCardYear));
    });
});