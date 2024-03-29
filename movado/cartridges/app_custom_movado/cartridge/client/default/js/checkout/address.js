'use strict';

/**
 * Populate the Billing Address Summary View
 * @param {string} parentSelector - the top level DOM selector for a unique address summary
 * @param {Object} address - the address data
 */
function populateAddressSummary(parentSelector, address) {
    $.each(address, function (attr) {
        var val = address[attr];
        $('.' + attr, parentSelector).text(val || '');
    });
}

/**
 * returns a formed <option /> element
 * @param {Object} shipping - the shipping object (shipment model)
 * @param {boolean} selected - current shipping is selected (for PLI)
 * @param {order} order - the Order model
 * @param {Object} [options] - options
 * @returns {Object} - the jQuery / DOMElement
 */
function optionValueForAddress(shipping, selected, order, options) {
    var safeOptions = options || {};
    var isBilling = safeOptions.type && safeOptions.type === 'billing';
    var className = safeOptions.className || '';
    var isSelected = selected;
    var isNew = !shipping;
    if (!Resources.PICKUP_FROM_STORE) {
        if (typeof shipping === 'string') {
            return $('<option class="' + className + '" disabled>' + shipping + '</option>');
        }
    }
    var safeShipping = shipping || {};
    var shippingAddress = safeShipping.shippingAddress || {};

    if (isBilling && isNew && !order.billing.matchingAddressId) {
        shippingAddress = order.billing.billingAddress.address || {};
        isNew = false;
        isSelected = true;
        safeShipping.UUID = 'manual-entry';
    }

    var uuid = safeShipping.UUID ? safeShipping.UUID : 'new';
    var optionEl = $('<option class="' + className + '" />');
    optionEl.val(uuid);

    var title;

    if (isNew) {
        title = order.resources.addNewAddress;
    } else {
        title = [];
        if (shippingAddress.firstName) {
            title.push(shippingAddress.firstName);
        }
        if (shippingAddress.lastName) {
            title.push(shippingAddress.lastName);
        }
        if (shippingAddress.companyName) {
            title.push(shippingAddress.companyName);
        }
        if (shippingAddress.address1) {
            title.push(shippingAddress.address1);
        }
        if (shippingAddress.address2) {
            title.push(shippingAddress.address2);
        }
        if (shippingAddress.city) {
            if (shippingAddress.state) {
                title.push(shippingAddress.city + ',');
            } else {
                title.push(shippingAddress.city);
            }
        }
        if (shippingAddress.stateCode) {
            title.push(shippingAddress.stateCode);
        }
        if (shippingAddress.postalCode) {
            title.push(shippingAddress.postalCode);
        }
        if (!isBilling && safeShipping.selectedShippingMethod) {
            title.push('-');
            title.push(safeShipping.selectedShippingMethod.displayName);
        }

        if (title.length > 2) {
            title = title.join(' ');
        } else {
            title = order.resources.newAddress;
        }
    }
    optionEl.text(title);

    var keyMap = {
        'data-first-name': 'firstName',
        'data-last-name': 'lastName',
        'data-company-name': 'companyName',
        'data-address1': 'address1',
        'data-address2': 'address2',
        'data-city': 'city',
        'data-state-code': 'stateCode',
        'data-postal-code': 'postalCode',
        'data-country-code': 'countryCode',
        'data-phone': 'phone'
    };
    $.each(keyMap, function (key) {
        var mappedKey = keyMap[key];
        var mappedValue = shippingAddress[mappedKey];
        // In case of country code
        if (mappedValue && typeof mappedValue === 'object') {
            mappedValue = mappedValue.value;
        }

        optionEl.attr(key, mappedValue || '');
    });

    var giftObj = {
        'data-is-gift': 'isGift',
        'data-gift-message': 'giftMessage'
    };

    $.each(giftObj, function (key) {
        var mappedKey = giftObj[key];
        var mappedValue = safeShipping[mappedKey];
        optionEl.attr(key, mappedValue || '');
    });

    if (isSelected) {
        optionEl.attr('selected', true);
    }

    return optionEl;
}

/**
 * returns address properties from a UI form
 * @param {Form} form - the Form element
 * @returns {Object} - a JSON object with all values
 */
function getAddressFieldsFromUI(form) {
    var address = {
        firstName: $('input[name$=_firstName]', form).val(),
        lastName: $('input[name$=_lastName]', form).val(),
        companyName: $('input[name$=_companyName]', form).val(),
        address1: $('input[name$=_address1]', form).val(),
        address2: $('input[name$=_address2]', form).val(),
        city: $('input[name$=_city]', form).val(),
        postalCode: $('input[name$=_postalCode]', form).val(),
        stateCode: $('select[name$=_stateCode],input[name$=_stateCode]', form).val(),
        countryCode: $('select[name$=_country]', form).val(),
        phone: $('input[name$=_phone]', form).val()
    };
    return address;
}

function checkForInput(element) {
    if ($(element).val().length > 0) {
        $(element).addClass('auto-is-valid is-valid');
    } else {
        $(element).removeClass('auto-is-valid is-valid');
    }
}


module.exports = {
    methods: {
        populateAddressSummary: populateAddressSummary,
        optionValueForAddress: optionValueForAddress,
        getAddressFieldsFromUI: getAddressFieldsFromUI
    },

    showDetails: function () {
        $('.btn-show-details').on('click', function () {
            var form = $(this).closest('form');

            var selectedAddressId = $('.addressSelector').val();
            selectedAddressId = selectedAddressId.substring(3, selectedAddressId.length);
            if (selectedAddressId) {
            	$('.shippingAddressId').val(selectedAddressId);
            }

            $('.billing-form input').each(function () {
                var $input = $(this);
                var $selectOption = $('.billing-form select');
                if ($input.val()) {
                    $input.removeClass('is-invalid auto-is-invalid');
                    $selectOption.removeClass('is-invalid auto-is-invalid');
                } else {
                    $input.removeClass('is-valid auto-is-valid is-invalid auto-is-invalid');
                    $selectOption.removeClass('auto-is-invalid auto-is-valid is-valid is-invalid');
                }
            });

            form.attr('data-address-mode', 'details');
            form.find('.multi-ship-address-actions').removeClass('d-none');
            form.find('.multi-ship-action-buttons .col-12.btn-save-multi-ship').addClass('d-none');
            paymentFieldValidationIcon(false);
        });
    },

    addNewAddress: function () {
        $('.btn-add-new').on('click', function () {
        	$('.shippingAddressId').val('');

        	var $el = $(this);
            if ($el.parents('#dwfrm_billing').length > 0) {
                // Handle billing address case
                $('body').trigger('checkout:clearBillingForm');
                var $option = $($el.parents('form').find('.addressSelector option')[0]);
                $option.attr('value', 'new');
                $option.text('New Address');
                $option.prop('selected', 'selected');
                $el.parents('[data-address-mode]').attr('data-address-mode', 'new');
                $('.billing-form input').removeClass('is-valid auto-is-valid is-invalid auto-is-invalid');
                $('.billing-form input').each(function () {
                    var $input = $(this);
                    if ($input.hasClass('cardNumber') || $input.hasClass('creditcard-holdername') || $input.hasClass('expirationDate') || $input.hasClass('creditcard-securitycode')) {
                        checkForInput(this);
                    }
                });

                $('.billing-form select').removeClass('auto-is-invalid auto-is-valid is-valid is-invalid');
            } else {
                // Handle shipping address case
                var $newEl = $el.parents('form').find('.addressSelector option[value=new]');
                $newEl.prop('selected', 'selected');
                $newEl.parent().trigger('change');
                $('.shipping-form input').removeClass('is-valid auto-is-valid is-invalid auto-is-invalid');
                $('.shipping-form select').removeClass('auto-is-invalid auto-is-valid is-valid is-invalid');
            }
            var $emailField = $('.billing-email');
            $emailField.val($('.shipping-email').val());
            var $phoneField = $('.billing-phone');
            $phoneField.val($('.shippingPhoneNumber').val());
            paymentFieldValidationIcon(true);
        });
    }
};

function paymentFieldValidationIcon(el) {
    $('.mx-field-wrapper input.input-wrapper-checkout,.mx-field-wrapper select.custom-select-box,.shipping-section .mx-field-wrapper input.input-wrapper-checkout,shipping-section .mx-field-wrapper select.custom-select-box').each(function () {
        if (($(this)[0].id !== 'cardNumber') && ($(this)[0].id !== 'holderName') && ($(this)[0].id !== 'expirationDate') && ($(this)[0].id !== 'securityCode')) {
            if ($(this)[0].id == 'shippingCountrydefault') {
                var selectedOption = $(this).siblings('.field-label-wrapper');
                if (el === true) {
                    selectedOption.removeClass('input-has-value');
                } else {
                    selectedOption.addClass('input-has-value');
                }
                $(this).removeClass('is-valid');
                if (selectedOption.hasClass('input-has-value')) {
                    $(this).closest('.mx-field-wrapper').find('.info-icon.info-icon-email').addClass('d-none');
                    $(this).addClass('is-valid');
                    $(this).closest('.security-code-group').find('.info-icon.info-icon-email').addClass('d-none');
                }
            } else if ($(this)[0].id == 'shippingCountry') {
                var selectedOption = $(this).siblings('.field-label-wrapper');
                if (el === true) {
                    selectedOption.removeClass('input-has-value');
                } else {
                    selectedOption.addClass('input-has-value');
                }
                $(this).removeClass('is-valid');
                if (selectedOption.hasClass('input-has-value')) {
                    $(this).closest('.mx-field-wrapper').find('.info-icon.info-icon-email').addClass('d-none');
                    $(this).addClass('is-valid');
                    $(this).closest('.security-code-group').find('.info-icon.info-icon-email').addClass('d-none');
                }
            } else if ($(this)[0].id == 'shippingState') {
                var selectedOption = $(this).siblings('.field-label-wrapper');
                $(this).removeClass('is-valid');
                if (selectedOption.hasClass('input-has-value')) {
                    $(this).closest('.mx-field-wrapper').find('.info-icon.info-icon-email').addClass('d-none');
                    $(this).addClass('is-valid');
                    $(this).closest('.security-code-group').find('.info-icon.info-icon-email').addClass('d-none');
                }
            } else if (!$(this).hasClass('is-invalid') && $(this).val().length > 0) {
                $(this).closest('.mx-field-wrapper').find('.info-icon.info-icon-email').addClass('d-none');
                $(this).addClass('is-valid');
                $(this).closest('.security-code-group').find('.info-icon.info-icon-email').addClass('d-none');
            } else {
                $(this).removeClass('is-valid');
                $(this).closest('.mx-field-wrapper').find('.info-icon.info-icon-email').removeClass('d-none');
                $(this).closest('.security-code-group').find('.info-icon.info-icon-email').removeClass('d-none');
            }
        }
    });
}