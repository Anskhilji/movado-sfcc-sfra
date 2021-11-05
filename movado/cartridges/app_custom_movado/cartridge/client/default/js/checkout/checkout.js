'use strict';
var addressHelpers = require('./address');
var shippingHelpers = require('./shipping');
var billingHelpers = require('./billing');
var summaryHelpers = require('./summary');
var formHelpers = require('base/checkout/formErrors');


/**
 * Create the jQuery Checkout Plugin.
 *
 * This jQuery plugin will be registered on the dom element in checkout.isml with the
 * id of "checkout-main".
 *
 * The checkout plugin will handle the different state the user interface is in as the user
 * progresses through the varying forms such as shipping and payment.
 *
 * Billing info and payment info are used a bit synonymously in this code.
 *
 */
(function ($) {
  $.fn.checkout = function () { // eslint-disable-line
      var plugin = this;

    //
    // Collect form data from user input
    //
      var formData = {
        // Shipping Address
          shipping: {},

        // Billing Address
          billing: {},

        // Payment
          payment: {},

        // Gift Codes
          giftCode: {}
      };

    //
    // The different states/stages of checkout
    //
      var checkoutStages = [
          'shipping',
          'payment',
          'placeOrder',
          'submitted'
      ];
    /**
     * Updates the URL to determine stage
     * @param {number} currentStage - The current stage the user is currently on in the checkout
     */
      function updateUrl(currentStage) {
          history.pushState(
          checkoutStages[currentStage],
          document.title,
          location.pathname
          + '?stage='
          + checkoutStages[currentStage]
          + '#'
          + checkoutStages[currentStage]
      );

       if($('.progressbar-container .checkout-progressbar').length) {
            $('.checkout-progressbar li').removeClass('active');
            $('.checkout-progressbar li').removeClass('completed');
            var checkedIcon = '<i class="fa fa-check"></i>';

            if (checkoutStages[currentStage] == 'shipping') {
                $('.checkout-progressbar li:nth-child(1)').addClass('active');
                $('.checkout-progressbar li:nth-child(1)').find('.step-no').html('1');
            }
            else if (checkoutStages[currentStage] === 'payment') {
                $('.checkout-progressbar li:nth-child(2)').addClass('active');
                $('.checkout-progressbar li:nth-child(2)').find('.step-no').html('2');
                $('.checkout-progressbar li:nth-child(1)').addClass('completed'); 
            }

            else if (checkoutStages[currentStage] === 'placeOrder' && $('.payment-information').data('payment-method-id') !== 'Affirm') {
                $('.checkout-progressbar li:nth-child(3)').addClass('active');
                $('.checkout-progressbar li:nth-child(3)').find('.step-no').html('3');
                $('.checkout-progressbar li:nth-child(2)').addClass('completed');
                $('.checkout-progressbar li:nth-child(1)').addClass('completed'); 
            }
            else {
                $('.checkout-progressbar li:nth-child(4)').addClass('active');
                $('.checkout-progressbar li:nth-child(4)').find('.step-no').html('4');
                $('.checkout-progressbar li:nth-child(3)').addClass('completed');
                $('.checkout-progressbar li:nth-child(2)').addClass('completed');
                $('.checkout-progressbar li:nth-child(1)').addClass('completed');
            }
            $('.checkout-progressbar li.completed').find('.step-no').html(checkedIcon); 
        }

      $('.checkout-promo-section').removeClass('d-none');
         if (checkoutStages[currentStage] == 'placeOrder') {
        	 $('.checkout-promo-section').addClass('d-none');
              if ($('.payment-information').data('payment-method-id') == 'Affirm') {
                  var url = $('#affirm-config').data('affirupdateurl');
                  $.spinner().start();
                  $.ajax({
                      url: url,
                      method: 'GET',
                      success: function (data) {
                          $('#vcn-data').data('vcndata', JSON.parse(data.vcndata));
                          $.spinner().stop();
                      }
                  });
              }
          }
         $('body').trigger('checkOutStage:success', checkoutStages[currentStage]);
      }

    //
    // Local member methods of the Checkout plugin
    //
      var members = {

        // initialize the currentStage variable for the first time
          currentStage: 0,

        /**
         * Set or update the checkout stage (AKA the shipping, billing, payment, etc... steps)
         * @returns {Object} a promise
         */
          updateStage: function () {
              var stage = checkoutStages[members.currentStage];
              var defer = $.Deferred(); // eslint-disable-line
              //  Handle active and completed step

              if (stage === 'shipping') {
            //
            // Clear Previous Errors
            //
                  formHelpers.clearPreviousErrors('.shipping-form');

            //
            // Submit the Shipiing Address Form
            //
                  var isMultiShip = $('#checkout-main').hasClass('multi-ship');
                  var formSelector = isMultiShip ?
                '.multi-shipping .active form' : '.single-shipping .shipping-form';
                  var form = $(formSelector);

                  if (isMultiShip && form.length === 0) {
              // in case the multi ship form is already submitted
                      var url = $('#checkout-main').attr('data-checkout-get-url');
                      $.ajax({
                          url: url,
                          method: 'GET',
                          success: function (data) {
                              if (!data.error) {
                                  $('body').trigger('checkout:updateCheckoutView',
                        { order: data.order, customer: data.customer });
                                  defer.resolve();
                              } else if ($('.shipping-error .alert-danger').length < 1) {
                                  var errorMsg = data.message;
                                  var errorHtml = '<div class="alert card alert-danger alert-dismissible valid-cart-error ' +
                    'fade show" role="alert">' +
                    '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                    '<span aria-hidden="true">&times;</span>' +
                    '</button>' + errorMsg + '</div>';
                                  $('.shipping-error').append(errorHtml);
                                  defer.reject();
                              }
                          },
                          error: function () {
                  // Server error submitting form
                              defer.reject();
                          }
                      });
                  } else {
                      var shippingFormData = form.serialize();

                      $('body').trigger('checkout:serializeShipping', {
                          form: form,
                          data: shippingFormData,
                          callback: function (data) {
                              shippingFormData = data;
                          }
                      });

                      $.ajax({
                          url: form.attr('action'),
                          method: 'POST',
                          data: shippingFormData,
                          success: function (data) {
                              shippingHelpers.methods.shippingFormResponse(defer, data);
                              if (!data.error) {
                                var scrollUtil = require('../utilities/scrollUtil');
                                scrollUtil.scrollPaymentSection('.payment-form', 65);
                              }
                          },
                          error: function (err) {
                              if (err.responseJSON.redirectUrl) {
                                  window.location.href = err.responseJSON.redirectUrl;
                              }
                  // Server error submitting form
                              defer.reject(err.responseJSON);
                          }
                      });
                  }
                  return defer;
              } else if (stage === 'payment') {
            //
            // Submit the Billing Address Form
            //

                  formHelpers.clearPreviousErrors('.payment-form');

                  var paymentForm = $('#dwfrm_billing').serialize();

                  if($('.shipping-express-checkout').length && $('.shipping-express-checkout').is(':visible')) {
                    $('.shipping-express-checkout').addClass('d-none');
                  }
                  $('body').trigger('checkout:serializeBilling', {
                      form: $('#dwfrm_billing'),
                      data: paymentForm,
                      callback: function (data) { paymentForm = data; }
                  });

                  if ($('.data-checkout-stage').data('customer-type') === 'registered') {
              // if payment method is credit card
                      if ($('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
                          if (!($('.payment-information').data('is-new-payment'))) {
                              var cvvCode = $('.saved-payment-instrument.' +
                  'selected-payment .saved-payment-security-code').val();

                              if (cvvCode === '') {
                                  $('.saved-payment-instrument.' +
                        'selected-payment ' +
                    '.form-control').addClass('is-invalid');
                                  defer.reject();
                                  return defer;
                              }

                              var $savedPaymentInstrument = $('.saved-payment-instrument' +
                      '.selected-payment'
                  );

                              paymentForm += '&storedPaymentUUID=' +
                  $savedPaymentInstrument.data('uuid');

                              paymentForm += '&securityCode=' + cvvCode;
                          }
                      }
                  }


                  $.ajax({
                      url: $('#dwfrm_billing').attr('action'),
                      method: 'POST',
                      data: paymentForm,
                      success: function (data) {
                // look for field validation errors
                    	  if(data.email && data.email.value && typeof setAnalyticsTrackingByAJAX != 'undefined') {
                              setAnalyticsTrackingByAJAX.userTracking = JSON.stringify({email: data.email.value});
                              window.dispatchEvent(setAnalyticsTrackingByAJAX);
                          }
                          if (data.error) {
                              if (data.fieldErrors.length) {
                                  data.fieldErrors.forEach(function (error) {
                                      if (Object.keys(error).length) {
                                        formHelpers.loadFormErrors('.payment-form', error);
                                        var $billingFormMode = $('.billing-form').attr('data-address-mode');
                                        if ( $billingFormMode !== 'details') {
                                            $('.billing-form').attr('data-address-mode', 'details');
                                        }
                                    }
                                  });
                                  var scrollUtil = require('../utilities/scrollUtil');
                                  var firstErrorFieldName =  $('.payment-form').find('.is-invalid').first()[0].name;
                                  if (firstErrorFieldName == 'dwfrm_billing_paymentMethod') {
                                      scrollUtil.scrollInvalidFields('.payment-form', 700, 300);
                                  } else {
                                      scrollUtil.scrollInvalidFields('.payment-form', -80, 300);
                                  }
                              }

                              if (data.serverErrors.length) {
                                  data.serverErrors.forEach(function (error) {
                                      $('.error-message').show();
                                      $('.error-message-text').text(error);
                                  });
                              }

                              if (data.cartError) {
                                  window.location.href = data.redirectUrl;
                              }

                              $('#cardNumber').val($('#originalCardNumber').val());
                              $('#securityCode').val('');

                              defer.reject();
                          } else {
                  //
                  // Populate the Address Summary
                  //
                              $('body').trigger('checkout:updateCheckoutView',
                      { order: data.order, customer: data.customer });

                              if (data.renderedPaymentInstruments) {
                                  $('.stored-payments').empty().html(
                        data.renderedPaymentInstruments
                    );
                              }

                              if (data.customer.registeredUser
                      && data.customer.customerPaymentInstruments.length
                  ) {
                                  $('.cancel-new-payment').removeClass('checkout-hidden');
                              }

                              defer.resolve(data);
                          }
                      },
                      error: function (err) {
                          if (err.responseJSON.redirectUrl) {
                              window.location.href = err.responseJSON.redirectUrl;
                          }
                      }
                  });

                  return defer;
              } else if (stage === 'placeOrder' && $('.payment-information').data('payment-method-id') !== 'Affirm') {
                  $('.checkout-promo-section').addClass('d-none');

                  if ($('.payment-details .amazon-pay-option').length) {
                      window.location.replace($('.place-order').data('action'));
                      return;
                  }

                  $.ajax({
                      beforeSend: function() {
                        $.spinner().start();
                      },
                      url: $('.place-order').data('action'),
                      method: 'POST',
                      success: function (data) {
                          if (data.error) {
                              if (data.cartError) {
                                  window.location.href = data.redirectUrl;
                                  defer.reject();
                              } else {
                    // go to appropriate stage and display error message
                                  defer.reject(data);
                              }
                          } else {
                              var continueUrl = data.continueUrl;
                              var urlParams = {
                                  ID: data.orderID,
                                  token: data.orderToken
                              };
                              /***
                               * Custom Start: Clyde Integration
                               */
                              if (window.Resources && window.Resources.IS_CLYDE_ENABLED) {
                                urlParams.clydeContractProductList = data.contractProductList
                              }

                              /**
                               * Custom End:
                               */

                              continueUrl += (continueUrl.indexOf('?') !== -1 ? '&' : '?') +
                  Object.keys(urlParams).map(function (key) {
                      return key + '=' + encodeURIComponent(urlParams[key]);
                  }).join('&');

                              window.location.href = continueUrl;
                              defer.resolve(data);
                          }
                          $.spinner().stop();
                      },
                      error: function () {
                          $.spinner().stop();
                      }
                  });
                  return defer;
              }
              var p = $('<div>').promise(); // eslint-disable-line
                setTimeout(function () {
                p.done(); // eslint-disable-line
                }, 500);
                return p; // eslint-disable-line
              },

        /**
         * Initialize the checkout stage.
         *
         * TODO: update this to allow stage to be set from server?
         */
          initialize: function () {
          // set the initial state of checkout
              members.currentStage = checkoutStages
          .indexOf($('.data-checkout-stage').data('checkout-stage'));
              $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);

          //
          // Handle Payment option selection
          //
              $('input[name$="paymentMethod"]', plugin).on('change', function () {
                  $('.credit-card-form').toggle($(this).val() === 'CREDIT_CARD');
              });

          //
          // Handle Next State button click
          //
              $(plugin).on('click', '.next-step-button button', function () {
                  $('.next-step-button button').attr('disabled', 'disabled');
                  members.nextStage();
              });

          //
          // Handle Edit buttons on shipping and payment summary cards
          //
              $('.shipping-summary .edit-button', plugin).on('click', function () {
                  if (!$('#checkout-main').hasClass('multi-ship')) {
                      $('body').trigger('shipping:selectSingleShipping');
                  }
                  if($('.shipping-express-checkout').length && !$('.shipping-express-checkout').is(':visible')) {
                    $('.shipping-express-checkout').removeClass('d-none');
                  }
                  members.gotoStage('shipping');
              });

              $('.payment-summary .edit-button', plugin).on('click', function () {
                  if($('.shipping-express-checkout').length && !$('.shipping-express-checkout').is(':visible')) {
                      $('.shipping-express-checkout').removeClass('d-none');
                  }  
                  members.gotoStage('payment');
              });

          //
          // remember stage (e.g. shipping)
          //
              updateUrl(members.currentStage);

          //
          // Listen for foward/back button press and move to correct checkout-stage
          //
              $(window).on('popstate', function (e) {
            //
            // Back button when event state less than current state in ordered
            // checkoutStages array.
            //
                  if (e.state === null ||
                checkoutStages.indexOf(e.state) < members.currentStage) {
                      members.handlePrevStage(false);
                  } else if (checkoutStages.indexOf(e.state) > members.currentStage) {
              // Forward button  pressed
                      members.handleNextStage(false);
                  }
              });

          //
          // Set the form data
          //
              plugin.data('formData', formData);
          },

        /**
         * The next checkout state step updates the css for showing correct buttons etc...
         */
          nextStage: function () {
              var promise = members.updateStage();

              promise.done(function () {
            // Update UI with new stage
                  members.handleNextStage(true);
                  $('.next-step-button button').removeAttr('disabled');
                  
              });

              promise.fail(function (data) {
                  $('.next-step-button button').removeAttr('disabled');
            // show errors
                  if (data) {
                      if (data.errorStage) {
                          members.gotoStage(data.errorStage.stage);

                          if (data.errorStage.step === 'billingAddress') {
                              var $billingAddressSameAsShipping = $(
                      'input[name$="_shippingAddressUseAsBillingAddress"]'
                  );
                              if ($billingAddressSameAsShipping.is(':checked')) {
                                  $billingAddressSameAsShipping.prop('checked', false);
                              }
                          }
                      }

                      if (data.errorMessage) {
                          $('.error-message').show();
                          $('.error-message-text').text(data.errorMessage);
                          var scrollPos =  $(".error-message").offset().top - $('.container').offset().top;
                          $(window).scrollTop(scrollPos);
                      }
                  }
              });
          },

        /**
         * The next checkout state step updates the css for showing correct buttons etc...
         *
         * @param {boolean} bPushState - boolean when true pushes state using the history api.
         */
          handleNextStage: function (bPushState) {
              if (members.currentStage < checkoutStages.length - 1) {
            // move stage forward
                  members.currentStage++;

            //
            // show new stage in url (e.g.payment)
            //
                  if (bPushState) {
                      updateUrl(members.currentStage);
                  }
              }

          // Set the next stage on the DOM
              $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);
          },

        /**
         * Previous State
         */
          handlePrevStage: function () {
              if (members.currentStage > 0) {
            // move state back
                  members.currentStage--;
                  updateUrl(members.currentStage);
              }

              $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);
          },

        /**
         * Use window history to go to a checkout stage
         * @param {string} stageName - the checkout state to goto
         */
          gotoStage: function (stageName) {
              members.currentStage = checkoutStages.indexOf(stageName);
              updateUrl(members.currentStage);
              $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);
          }
      };

    //
    // Initialize the checkout
    //
      members.initialize();

      return this;
  };


}(jQuery));

function appendToUrl(url, params) {
    var newUrl = url;
    newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(function (key) {
        return key + '=' + encodeURIComponent(params[key]);
    }).join('&');

    return newUrl;
}

function createErrorNotification(message) {
    var errorHtml = '<div class="alert card alert-dismissible error-message" role="alert">' +
                        '<p class="error-message-text checkout-global-error">' + message +
                          '</p></div>';

    $('.checkout-global-error').append(errorHtml);
}

/**
 * re-renders the order totals in the checkout
 * @param {Object} data - AJAX response from the server
 */
function updateCheckoutTotals(data) {
    if (typeof data.totals !== 'undefined' && typeof data.totals.isFree !== 'undefined' && data.totals.isFree === true) {
        $('.shipping-total-cost').empty().append(data.totals.freeShippingLabel);
    } else {
        $('.shipping-total-cost').empty().append(data.totals.totalShippingCost);
    }
    
    $('.tax-total').empty().append(data.totals.totalTax);
    $('.grand-total-sum').empty().append(data.totals.grandTotal);
    $('.sub-total').empty().append(data.totals.subTotal);
    $('.grand-total-price').empty().append(data.totals.subTotal);

    if (data.totals.orderLevelDiscountTotal.value > 0) {
        $('.order-discount').removeClass('hide-order-discount');
        $('.order-discount-total').empty()
            .append('- ' + data.totals.orderLevelDiscountTotal.formatted);
    } else {
        $('.order-discount').addClass('hide-order-discount');
    }

    if (data.totals.shippingLevelDiscountTotal.value > 0 && typeof data.totals !== 'undefined' && typeof data.totals.isFree !== 'undefined' && data.totals.isFree === false) {
        $('.shipping-discount').removeClass('hide-shipping-discount');
        $('.shipping-discount-total').empty().append('- ' +
            data.totals.shippingLevelDiscountTotal.formatted);
    } else {
        $('.shipping-discount').addClass('hide-shipping-discount');
    }

    data.items.forEach(function (item) {
        $('.item-' + item.UUID).empty().append(item.renderedPromotions);
        $('.item-total-' + item.UUID).empty().append(item.priceTotal.renderedPrice);
    });
}

/**
 * re-renders the approaching discount messages
 * @param {Object} approachingDiscounts - updated approaching discounts for the cart
 */
function updateApproachingDiscounts(approachingDiscounts) {
    var html = '';
    $('.approaching-discounts').empty();
    if (approachingDiscounts.length > 0) {
        approachingDiscounts.forEach(function (item) {
            html += '<div class="single-approaching-discount text-center">'
                + item.discountMsg + '</div>';
        });
    }
    $('.approaching-discounts').append(html);
}

/**
 * Checks whether it displays error message
 * @param {Object} data - AJAX response from the server
 */
function checkPromoError(data) {
    if (data.valid.error) {
        if (data.valid.message) {
            var errorHtml = '<div class="alert card alert-dismissible error-message" role="alert">' +
            '<p class="error-message-text checkout-global-error">' + data.valid.message +
              '</p></div>';

            $('.checkout-global-error').empty().append(errorHtml);
        }
    }
}

var exports = {
    initialize: function () {
        $('#checkout-main').checkout();
    },

    updateCheckoutView: function () {
        $('body').on('checkout:updateCheckoutView', function (e, data) {
            shippingHelpers.methods.updateMultiShipInformation(data.order);
            summaryHelpers.updateTotals(data.order.totals);
            data.order.shipping.forEach(function (shipping) {
                shippingHelpers.methods.updateShippingInformation(
                shipping,
                data.order,
                data.customer,
                data.options
          );
                $('body').trigger('checkOutShipping:success', [shipping.selectedShippingMethod.shippingCost,shipping.selectedShippingMethod.displayName, data.order.couponLineItemArray]);
            });
            billingHelpers.methods.updateBillingInformation(
            data.order,
            data.customer,
            data.options
        );
            billingHelpers.methods.updatePaymentInformation(data.order, data.options);
            summaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);
            $('.checkout-coupons-and-promos').empty().append(data.order.totals.discountsHtml);
        });
    },

    function () {
    	$('.checkout-promo-code-form').submit(function (e) {
	        e.preventDefault();
            $.spinner().start();
            var $couponRequiredError = $('.checkout-coupon-missing-error');
            var $couponGenericError = $('.checkout-coupon-error-message');
	        $couponRequiredError.hide();
	        $couponGenericError.empty();
	        if (!$('.checkout-coupon-code-field').val()) {
	            $('.checkout-promo-code-form .form-control').addClass('is-invalid');
	            $couponRequiredError.show();
	            $.spinner().stop();
	            return false;
	        }
	        var $form = $('.checkout-promo-code-form');
	        $('.checkout-promo-code-form .form-control').removeClass('is-invalid');
	        $couponGenericError.empty();

	        $.ajax({
	            url: $form.attr('action'),
	            type: 'GET',
	            dataType: 'json',
	            data: $form.serialize(),
	            success: function (data) {
	                if (data.error) {
	                    $('.checkout-promo-code-form .form-control').addClass('is-invalid');
	                    $couponGenericError.empty().append(data.errorMessage);
	                } else {
	                    $('.checkout-coupons-and-promos').empty().append(data.totals.discountsHtml);
	                    updateCheckoutTotals(data);
	                    updateApproachingDiscounts(data.approachingDiscounts);
	                    checkPromoError(data);
	                }
	                $('.checkout-coupon-code-field').val('');
	                $.spinner().stop();
	            },
	            error: function (err) {
	                if (err.responseJSON.redirectUrl) {
	                    window.location.href = err.responseJSON.redirectUrl;
	                } else {
	                    createErrorNotification(err.errorMessage);
	                    $.spinner().stop();
	                }
	            }
	        });
	        return false;
	    });

    	$('body').on('click', '.checkout-coupons-and-promos .remove-coupon', function (e) {
            e.preventDefault();

            var couponCode = $(this).data('code');
            var uuid = $(this).data('uuid');
            var $deleteConfirmBtn = $('.delete-coupon-confirmation-btn');
            var $productToRemoveSpan = $('.coupon-to-remove');

            $deleteConfirmBtn.data('uuid', uuid);
            $deleteConfirmBtn.data('code', couponCode);

            $productToRemoveSpan.empty().append(couponCode);
        });

        $('body').on('click', ' .checkout-coupons-remove .delete-coupon-confirmation-btn', function (e) {
            e.preventDefault();

            var url = $(this).data('action');
            var uuid = $(this).data('uuid');
            var couponCode = $(this).data('code');
            var urlParams = {
                code: couponCode,
                uuid: uuid
            };

            url = appendToUrl(url, urlParams);

            $('body > .modal-backdrop').remove();

            $.spinner().start();
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    $('.coupon-uuid-' + uuid).remove();
                    updateCheckoutTotals(data);
                    $.spinner().stop();
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        createErrorNotification(err.responseJSON.errorMessage);
                        $.spinner().stop();
                    }
                }
            });
        });
        // var holderName = document.getElementById('holderName');
        // holderName.addEventListener('textInput', function (event) {
        //     var char = event.data;
        //     var keyCode = char.charCodeAt(0);
        //     // alert(keyCode)
        //     if(!((keyCode > 64 && keyCode < 91) || (keyCode > 96 && keyCode < 123) || keyCode == 32)) {
        //         event.preventDefault();
        //     }
        // });

        // var holderName = document.getElementById('holderName');
        // holderName.addEventListener('textInput', function (event) {
        //     var char = event.data;
        //     var keyCode = char.charCodeAt(0);
        //     // alert(keyCode);
        //     if(!((keyCode > 64 && keyCode < 91) || (keyCode > 96 && keyCode < 123) || keyCode == 32)) {
        //         event.preventDefault();
        //     }
        // });

        $('#holderName').keyup(function () {
            this.value = this.value.replace(/[^A-z\ ]/g,'');
        });


        // $('.creditcard-holdername').bind('keydown', function(event) {
        //     alert(event.keyCode)
        //     if(!((event.charCode > 64 && event.charCode < 91) || (event.charCode > 96 && event.charCode < 123) || event.charCode == 32)) {
        //         event.preventDefault();
        //     }
        // })

        $('.creditcard-securitycode').on('keypress', function(event) {
            if(!((event.charCode >= 48 && event.charCode <= 57))) {
                return false;
            }
        })
    }
};

[billingHelpers, shippingHelpers, addressHelpers].forEach(function (library) {
    Object.keys(library).forEach(function (item) {
        if (item != 'handleCreditCardNumber' && item != 'creditCardExpiryDate') {
            exports[item] = library[item];
            if (typeof library[item] === 'object') {
                exports[item] = $.extend({}, exports[item], library[item]);
            } else {
                exports[item] = library[item];
            }
        }
    });
});

module.exports = exports;
