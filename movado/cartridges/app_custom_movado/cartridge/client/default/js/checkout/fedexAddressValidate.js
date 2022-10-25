var formHelpers = require('base/checkout/formErrors');
$(document).ready(function () {
    $('.submit-shipping').on('click', function (e) {
        formHelpers.clearPreviousErrors('.shipping-form');
        var fedexBtnPopupCall = $('.fedex-btn-popup-call');
        var fedex = fedexBtnPopupCall.attr('data-fedex');
        if (fedex == 'true') {
            e.preventDefault();
            e.stopPropagation();
            var shippingForm = $('.shipping-form');
            var formData = shippingForm.serialize();
            var fedexURL = fedexBtnPopupCall.data('url');
            var isMultiShip = $('#checkout-main').hasClass('multi-ship');
            var formButton = shippingForm.is(':visible') ? '.submit-shipping' : '.submit-payment';
            var fedExModal = $('#fedExAdressModal');
            var userAddress = $('.user-address');
            var userCity = $('.user-city');
            var userPostalCode = $('.user-postalCode');
            var addressValidationBox = $('.fedex-address-validation-box');
            var popupContainer = $('.fedex-popup-body-container');
            var recomendedAddressBox = $('.recommended-address-wrapper');
            var fedexRecommendation = $('.fedex-recommended-address');
            var fedexUserContent = $('.fedex-popup-body-label-sub');
            var fedexRecommendedContent = $('.fedex-popup-body-label-sub');
            var formSelector = isMultiShip ?
                '.multi-shipping .active form' :
                '.single-shipping form';
            var defer = $.Deferred();
            $.ajax({
                url: fedexURL,
                type: 'post',
                data: formData,
                success: function (data) {
                    if (data.error) {
                        if (data.fieldErrors && data.fieldErrors.length) {
                            data.fieldErrors.forEach(function (error) {
                                if (Object.keys(error).length) {
                                    formHelpers.loadFormErrors(formSelector, error);
                                }
                            });
                            defer.reject(data);
                        }
                        // if fedex return any error
                        fedexBtnPopupCall.attr('data-fedex', 'false');
                        $(formButton).click();
                    }
                    //if fedex has any recomendation
                    if (!data.error && data.fedExAddressValidationAPI && data.fedExAddressValidationAPI.validateObject && data.fedExAddressValidationAPI.validateObject.fedExAddress == true) {
                        recomendedAddressBox.removeClass('d-none');
                        popupContainer.removeClass('signle-box-container');
                        addressValidationBox.removeClass('popup-body-content');
                        fedexRecommendedContent.text(Resources.FEDEX_RECOMMENDED_ADDRESS_MESSAGE);
                        fedexRecommendation.attr('data-fedex-address', JSON.stringify(data.fedExAddressValidationAPI.fedExApiAddress));
                        $('.recomended-address').text(data.fedExAddressValidationAPI.fedExApiAddress.streetAddress);
                        $('.recomended-city').text(data.fedExAddressValidationAPI.fedExApiAddress.city + ', ' + data.fedExAddressValidationAPI.fedExApiAddress.stateOrProvinceCode);
                        $('.recomended-postalCode').text(data.fedExAddressValidationAPI.fedExApiAddress.postalCode);
                        userAddress.text(data.fedExAddressValidationAPI.userAddress.streetLines);
                        userCity.text(data.fedExAddressValidationAPI.userAddress.city + ', ' + data.fedExAddressValidationAPI.userAddress.state);
                        userPostalCode.text(data.fedExAddressValidationAPI.userAddress.postalCode);
                        fedExModal.modal('show');
                        defer.reject();
                        //if fedex validate user address is already correct
                    } else if (!data.error && data.fedExAddressValidationAPI && data.fedExAddressValidationAPI.validateObject && data.fedExAddressValidationAPI.validateObject.fedExAddress == false) {
                        recomendedAddressBox.addClass('d-none');
                        popupContainer.addClass('signle-box-container');
                        addressValidationBox.addClass('popup-body-content');
                        fedexUserContent.text(Resources.FEDEX_USER_ADDRESS_MESSAGE);
                        userAddress.text(data.fedExAddressValidationAPI.userAddress.streetLines);
                        userCity.text(data.fedExAddressValidationAPI.userAddress.city + ', ' + data.fedExAddressValidationAPI.userAddress.state);
                        userPostalCode.text(data.fedExAddressValidationAPI.userAddress.postalCode);
                        fedExModal.modal('show');
                        defer.reject();
                    }
                    $(document).on('click', '.fedex-continue-btn', function (e) {
                        var fedexRecommendedAddress;
                        var recommendedAddress = $(this).hasClass('fedex-recommend');
                        var userAddress = $(this).hasClass('user-recommend');
                        var fedexAddres = fedexRecommendation.attr('data-fedex-address');
                        if (fedexAddres != '') {
                            fedexRecommendedAddress = JSON.parse(fedexRecommendation.attr('data-fedex-address'));
                        }
                        var checkoutFormStage = shippingForm.is(':visible') ? 'shipping' : 'billing';
                        if (recommendedAddress) {
                            $('.' + checkoutFormStage + 'AddressOne').val(fedexRecommendedAddress.streetAddress);
                            $('.' + checkoutFormStage + 'AddressCity').val(fedexRecommendedAddress.city);
                            $('.' + checkoutFormStage + 'ZipCode').val(fedexRecommendedAddress.postalCode);
                            $('.' + checkoutFormStage + 'State option:selected').removeAttr('selected');                          
                            $('.' + checkoutFormStage + 'State option[value=' + fedexRecommendedAddress.stateOrProvinceCode + ']').prop('selected', true);
                            fedexBtnPopupCall.attr('data-fedex', 'false');
                            fedExModal.modal('hide');
                            $(formButton).click();
                        } else if (userAddress) {
                            fedexBtnPopupCall.attr('data-fedex', 'false');
                            fedExModal.modal('hide');
                            $(formButton).click();
                        } else {
                            fedExModal.modal('show');
                        }
                    });

                    $(document).on('click', '.edit-user-address', function () {
                        fedExModal.modal('hide');
                    })
                }
            });
        }
    });
})