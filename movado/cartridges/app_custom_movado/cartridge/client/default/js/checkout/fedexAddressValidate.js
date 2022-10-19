var formHelpers = require('base/checkout/formErrors');
$(document).ready(function(){
    $('.submit-shipping, .submit-payment').on('click', function (e) {
        formHelpers.clearPreviousErrors('.shipping-form');

        var fedex = $('.fedex-btn-popup-call').attr('data-fedex');
        e.preventDefault();
        e.stopPropagation();
        if (fedex == "true") {
            var form = $('.shipping-form').is(':visible') ?  $('.single-shipping .shipping-form') : $('.payment-form');
            var formButton = $('.shipping-form').is(':visible') ?  '.submit-shipping' : '.submit-payment';
            var formData = form.serialize();
            var fedexURL = $('.fedex-btn-popup-call').data('url');
            var isMultiShip = $('#checkout-main').hasClass('multi-ship');
            var formSelector = isMultiShip
                ? '.multi-shipping .active form'
                : '.single-shipping form';
            var defer = $.Deferred();
            $.ajax({
                url: fedexURL,
                type: 'post',
                data: {form:formData},
                success: function (data) {
                    if (data.error) {
                        // if (data.fieldErrors.length) {
                        //     data.fieldErrors.forEach(function (error) {
                        //         if (Object.keys(error).length) {
                        //             formHelpers.loadFormErrors(formSelector, error);
                        //         }
                        //     });
                        //     defer.reject(data);
                        // }
                        $('.fedex-btn-popup-call').attr('data-fedex',"false");
                        $(formButton).click();
                    }
                    if (!data.error && data.fedExAddressValidationAPI && data.fedExAddressValidationAPI.validateObject && data.fedExAddressValidationAPI.validateObject.fedExAddress == false) {
                        $('.fedex-recommended-address').attr('data-fedex-address',JSON.stringify(data.fedExAddressValidationAPI.fedExApiAddress));
                        $('.recomended-address').text(data.fedExAddressValidationAPI.fedExApiAddress.streetAddress);
                        $('.recomended-city').text(data.fedExAddressValidationAPI.fedExApiAddress.city +', '+data.fedExAddressValidationAPI.fedExApiAddress.stateOrProvinceCode);
                        $('.recomended-postalCode').text(data.fedExAddressValidationAPI.fedExApiAddress.postalCode);
                        $('.user-address').text(data.fedExAddressValidationAPI.userAddress.streetLines);
                        $('.user-city').text(data.fedExAddressValidationAPI.userAddress.city + ', ' + data.fedExAddressValidationAPI.userAddress.state);
                        $('.user-postalCode').text(data.fedExAddressValidationAPI.userAddress.postalCode);
                        $('#fedExAdressModal').modal('show');
                        defer.reject();
                    }
                    $(document).off('click', '.fedex-continue-btn').on('click', '.fedex-continue-btn', function (e) {

                        var recommendedAddress=  $('input[name="Recommended-address"]:checked').val();
                        var userAddress =  $('input[name="user-address"]:checked').val();
                        var fedexRecommendedAddress = JSON.parse($('.fedex-recommended-address').attr('data-fedex-address'));
                        var checkoutFormStage = $('.shipping-form').is(':visible') ?  'shipping' : 'billing';
                        if (recommendedAddress == 'on') {
                            $('.'+checkoutFormStage+'AddressOne').val(fedexRecommendedAddress.streetAddress);
                            $('.'+checkoutFormStage+'AddressCity').val(fedexRecommendedAddress.city);
                            $('.'+checkoutFormStage+'ZipCode').val(fedexRecommendedAddress.postalCode);
                            $("."+checkoutFormStage+"State option:selected").removeAttr("selected");
                            $("."+checkoutFormStage+"State option[value='"+fedexRecommendedAddress.stateOrProvinceCode+"']").attr('selected', 'selected');
                            $('.fedex-btn-popup-call').attr('data-fedex',"false");
                            $(formButton).click();
                            $('#fedExAdressModal').modal('hide');
                        } else if (userAddress == 'on') {
                            $('.fedex-btn-popup-call').attr('data-fedex',"false");
                            $(formButton).click();
                            $('#fedExAdressModal').modal('hide');
                        } else {
                            $('#fedExAdressModal').modal('show');
                        }

                        });
                }
            });
        }
    });
})