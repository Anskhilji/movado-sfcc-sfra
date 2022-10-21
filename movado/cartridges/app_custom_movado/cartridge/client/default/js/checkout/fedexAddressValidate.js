var formHelpers = require('base/checkout/formErrors');
$(document).ready(function () {
    $('.submit-shipping').on('click', function (e) {
        formHelpers.clearPreviousErrors('.shipping-form');

        var fedex = $('.fedex-btn-popup-call').attr('data-fedex');
        if (fedex == "true") {
            e.preventDefault();
            e.stopPropagation();
            var formData = $('.shipping-form').serialize();
            var fedexURL = $('.fedex-btn-popup-call').data('url');
            var isMultiShip = $('#checkout-main').hasClass('multi-ship');
            var formButton = $('.shipping-form').is(':visible') ? '.submit-shipping' : '.submit-payment';
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
                        $('.fedex-btn-popup-call').attr('data-fedex', "false");
                        $(formButton).click();
                    }
                    //if fedex has any recomendation
                    if (!data.error && data.fedExAddressValidationAPI && data.fedExAddressValidationAPI.validateObject && data.fedExAddressValidationAPI.validateObject.fedExAddress == true) {
                        $('.recommended-address-wrapper').removeClass('d-none');
                        $('.fedex-popup-body-container').removeClass('signle-box-container').parent().parent().parent().removeClass('popup-body-content');
                        $('.fedex-recommended-address').attr('data-fedex-address', JSON.stringify(data.fedExAddressValidationAPI.fedExApiAddress));
                        $('.recomended-address').text(data.fedExAddressValidationAPI.fedExApiAddress.streetAddress);
                        $('.recomended-city').text(data.fedExAddressValidationAPI.fedExApiAddress.city + ', ' + data.fedExAddressValidationAPI.fedExApiAddress.stateOrProvinceCode);
                        $('.recomended-postalCode').text(data.fedExAddressValidationAPI.fedExApiAddress.postalCode);
                        $('.user-address').text(data.fedExAddressValidationAPI.userAddress.streetLines);
                        $('.user-city').text(data.fedExAddressValidationAPI.userAddress.city + ', ' + data.fedExAddressValidationAPI.userAddress.state);
                        $('.user-postalCode').text(data.fedExAddressValidationAPI.userAddress.postalCode);
                        $('#fedExAdressModal').modal('show');
                        defer.reject();
                        //if fedex validate user address is already correct
                    } else if (!data.error && data.fedExAddressValidationAPI && data.fedExAddressValidationAPI.validateObject && data.fedExAddressValidationAPI.validateObject.fedExAddress == false) {
                        $('.recommended-address-wrapper').addClass('d-none');
                        $('.fedex-popup-body-container').addClass('signle-box-container').parent().parent().parent().addClass('popup-body-content');
                        $('.user-address').text(data.fedExAddressValidationAPI.userAddress.streetLines);
                        $('.user-city').text(data.fedExAddressValidationAPI.userAddress.city + ', ' + data.fedExAddressValidationAPI.userAddress.state);
                        $('.user-postalCode').text(data.fedExAddressValidationAPI.userAddress.postalCode);
                        $('#fedExAdressModal').modal('show');
                        defer.reject();
                    }
                    $(document).off('click', '.fedex-continue-btn').on('click', '.fedex-continue-btn', function (e) {
                        var fedexRecommendedAddress;
                        var recommendedAddress = $(this).hasClass('fedex-recommend');
                        var userAddress = $(this).hasClass('user-recommend');
                        var fedexAddres = $('.fedex-recommended-address').attr('data-fedex-address');
                        if(fedexAddres != ''){
                            fedexRecommendedAddress = JSON.parse($('.fedex-recommended-address').attr('data-fedex-address'));
                        }
                        var checkoutFormStage = $('.shipping-form').is(':visible') ? 'shipping' : 'billing';
                        if (recommendedAddress) {
                            $('.' + checkoutFormStage + 'AddressOne').val(fedexRecommendedAddress.streetAddress);
                            $('.' + checkoutFormStage + 'AddressCity').val(fedexRecommendedAddress.city);
                            $('.' + checkoutFormStage + 'ZipCode').val(fedexRecommendedAddress.postalCode);
                            $("." + checkoutFormStage + "State option:selected").removeAttr("selected");
                            $("." + checkoutFormStage + "State option[value='" + fedexRecommendedAddress.stateOrProvinceCode + "']").attr('selected', 'selected');
                            $('.fedex-btn-popup-call').attr('data-fedex', "false");
                            $('#fedExAdressModal').modal('hide');
                            $(formButton).click();
                        } else if (userAddress) {
                            $('.fedex-btn-popup-call').attr('data-fedex', "false");
                            $('#fedExAdressModal').modal('hide');
                            $(formButton).click();
                        } else {
                            $('#fedExAdressModal').modal('show');
                        }
                    });

                    $(document).off('click', '.fedex-user-address').on('click','.fedex-user-address',function(){
                        $('#fedExAdressModal').modal('hide');
                    })
                }
            });
        }
    });
})