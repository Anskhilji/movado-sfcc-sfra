var autocomplete;
var autocompleteBilling;
var address1Field;
var address2Field;
var postalField;
var address1FieldBilling;
var address2FieldBilling;
var postalFieldBilling;

window.initAutocomplete = function() {
    address1Field = document.querySelector("#shippingAddressOne");
    address2Field = document.querySelector("#shippingAddressTwo");
    postalField = document.querySelector("#shippingZipCode");

    address1FieldBilling = document.querySelector("#billingAddressOne");
    address2FieldBilling = document.querySelector("#billingAddressTwo");
    postalFieldBilling = document.querySelector("#billingZipCode");

  if (typeof google != 'undefined') {
    // Create the autocomplete object, restricting the search predictions to Shipping Form
    // addresses in the US and UK.
    autocomplete = new google.maps.places.Autocomplete(address1Field, {
      componentRestrictions: { country: window.Resources.GOOGLE_PAY_AUTOCOMPLETE },
      fields: ["address_components", "geometry"],
    });

    // Create the autocomplete object, restricting the search predictions to Billing Form
    // addresses in the US and UK.
    autocompleteBilling = new google.maps.places.Autocomplete(address1FieldBilling, {
      componentRestrictions: { country: window.Resources.GOOGLE_PAY_AUTOCOMPLETE },
      fields: ["address_components", "geometry"],
    });

    // When the user selects an address from the drop-down, populate the
    // address fields in the form.
    autocomplete.addListener("place_changed", fillInAddress);
    autocompleteBilling.addListener("place_changed", fillInAddressBilling);
  }
}


function fillInAddress(){
  // Get the place details from the autocomplete object.
  const place = autocomplete.getPlace();
  var address1 = "";
  var postcode = "";
  var shippingCountrydefault = document.querySelector("#shippingCountrydefault") ? document.querySelector("#shippingCountrydefault") : document.querySelector("#shippingCountry");
  var billingCounty = document.querySelector("#shippingCounty");
  var billingState = document.querySelector("#shippingState");

  // Get each component of the address from the place details,
  // and then fill-in the corresponding field on the form.
  // place.address_components are google.maps.GeocoderAddressComponent objects
  // which are documented at http://goo.gle/3l5i5Mr
  for (const component of place.address_components) {
    // @ts-ignore remove once typings fixed
    const componentType = component.types[0];

    switch (componentType) {
      case "street_number": {
        address1 = `${component.long_name} ${address1}`;
        break;
      }

      case "route": {
        address1 += component.long_name;
        break;
      }

      case "postal_code": {
        if (shippingCountrydefault.value == Resources.CHECKOUT_COUNTRY_US) {
          var $pattern = /^(^(?!0{5})[0-9][0-9]{4}$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/i
          var $isValid = $pattern.test(component.short_name);
          if ($isValid) {
              $('.shippingZipCode').addClass('auto-is-valid');
              $('.shippingZipCode').removeClass('auto-is-invalid');
          } else {
              $('.shippingZipCode').removeClass('auto-is-valid');
              $('.shippingZipCode').addClass('auto-is-invalid');
          }
        } else if (shippingCountrydefault.value == Resources.CHECKOUT_COUNTRY_GB) {
          var $pattern = /^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z])))) [0-9][A-Za-z]{2})$/g
          var $isValid = $pattern.test(component.short_name);
          if ($isValid) {
              $('.shippingZipCode').addClass('auto-is-valid');
              $('.shippingZipCode').removeClass('auto-is-invalid');
          } else {
              $('.shippingZipCode').removeClass('auto-is-valid');
              $('.shippingZipCode').addClass('auto-is-invalid');
          }
        } else if (shippingCountrydefault.value == Resources.CHECKOUT_COUNTRY_CH) {
          var $pattern = /^(^[a-zA-Z0-9 ]+$)/i
          var $isValid = $pattern.test(component.short_name);
          if ($isValid) {
              $('.shippingZipCode').addClass('auto-is-valid');
              $('.shippingZipCode').removeClass('auto-is-invalid');
          } else {
              $('.shippingZipCode').removeClass('auto-is-valid');
              $('.shippingZipCode').addClass('auto-is-invalid');
          }
        }

        postcode = `${component.short_name}`;
        break;
      }

      case "locality":
        var $pattern = /^(^[^(\\'\\<\\>\\\)]+$)/i
        var $isValid = $pattern.test(component.long_name);
        if ($isValid) {
            $('.shippingAddressCity').addClass('auto-is-valid');
            $('.shippingAddressCity').removeClass('auto-is-invalid');
        } else {
            $('.shippingAddressCity').removeClass('auto-is-valid');
            $('.shippingAddressCity').addClass('auto-is-invalid');
        }

        (document.querySelector("#shippingAddressCity")).value =
          component.long_name;
        break;

      case "postal_town":

        var $pattern = /^(^[^(\\'\\<\\>\\\)]+$)/i
        var $isValid = $pattern.test(component.long_name);
        if ($isValid) {
            $('.shippingAddressCity').addClass('auto-is-valid');
            $('.shippingAddressCity').removeClass('auto-is-invalid');
        } else {
            $('.shippingAddressCity').removeClass('auto-is-valid');
            $('.shippingAddressCity').addClass('auto-is-invalid');
        }

        (document.querySelector("#shippingAddressCity")).value =
          component.long_name;
        break;

      

      case "administrative_area_level_1": {
        if (billingState !== null) {
          billingState.value =
          component.short_name;
          $('.shippingState').addClass('auto-is-valid');
          $('.shippingState ').removeClass('auto-is-invalid');
        } else {
          $('.shippingState').removeClass('auto-is-valid');
          $('.shippingState').addClass('auto-is-invalid');
        }
        break;
      }
  
      case "administrative_area_level_2": {
        if (billingCounty !== null) {
            billingCounty.value =
            component.short_name;
            $('.shippingState').addClass('auto-is-valid');
            $('.shippingState ').removeClass('auto-is-invalid');
        } else {
          $('.shippingState').removeClass('auto-is-valid');
          $('.shippingState').addClass('auto-is-invalid');
        }
        break;
      }
    }
  }

  var $address1Value = address1;
  address1Field.value = $address1Value.replace(/'/g, ' ');
  postalField.value = postcode;
  autoCompleteFields();
}

function fillInAddressBilling(){
  // Get the place details from the autocomplete object.
  const place = autocompleteBilling.getPlace();
  var address1Billing = "";
  var postcodeBilling = "";
  var billingCounty = document.querySelector("#billingCounty");
  var billingState = document.querySelector("#billingState");
  var $billingCountry = document.querySelector("#billingCountry");
  var $shippingCountrydefault = document.querySelector("#shippingCountrydefault") ? document.querySelector("#shippingCountrydefault") : document.querySelector("#shippingCountry");

  

  // Get each component of the address from the place details,
  // and then fill-in the corresponding field on the form.
  // place.address_components are google.maps.GeocoderAddressComponent objects
  // which are documented at http://goo.gle/3l5i5Mr
  for (const component of place.address_components) {
    // @ts-ignore remove once typings fixed
    const componentType = component.types[0];

    switch (componentType) {
      case "street_number": {
        address1Billing = `${component.long_name} ${address1Billing}`;
        break;
      }

      case "route": {
        address1Billing += component.long_name;
        break;
      }

      case "postal_code": {
        if ($billingCountry.value == Resources.CHECKOUT_COUNTRY_US) {
          var $pattern = /^(^(?!0{5})[0-9][0-9]{4}$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/i
          var $isValid = $pattern.test(component.short_name);
          if ($isValid) {
              $('.billingZipCode').addClass('auto-is-valid');
              $('.billingZipCode').removeClass('auto-is-invalid');
          } else {
              $('.billingZipCode').removeClass('auto-is-valid');
              $('.billingZipCode').addClass('auto-is-invalid');
          }
        } else if ($billingCountry.value == Resources.CHECKOUT_COUNTRY_GB) {
          var $pattern = /^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z])))) [0-9][A-Za-z]{2})$/g
          var $isValid = $pattern.test(component.short_name);
          if ($isValid) {
              $('.billingZipCode').addClass('auto-is-valid');
              $('.billingZipCode').removeClass('auto-is-invalid');
          } else {
              $('.billingZipCode').removeClass('auto-is-valid');
              $('.billingZipCode').addClass('auto-is-invalid');
          }
        } else if ($billingCountry.value == Resources.CHECKOUT_COUNTRY_CH) {
          var $pattern = /^(^[a-zA-Z0-9 ]+$)/i
          var $isValid = $pattern.test(component.short_name);
          if ($isValid) {
              $('.billingZipCode').addClass('auto-is-valid');
              $('.billingZipCode').removeClass('auto-is-invalid');
          } else {
              $('.billingZipCode').removeClass('auto-is-valid');
              $('.billingZipCode').addClass('auto-is-invalid');
          }
        }
        postcodeBilling = `${component.long_name}`;
        break;
      }

      case "locality":

        var $pattern = /^(^[^(\\'\\<\\>\\\)]+$)/i
        var $isValid = $pattern.test(component.long_name);
        if ($isValid) {
            $('.billingAddressCity').addClass('auto-is-valid');
            $('.billingAddressCity').removeClass('auto-is-invalid');
        } else {
            $('.billingAddressCity').removeClass('auto-is-valid');
            $('.billingAddressCity').addClass('auto-is-invalid');
        }

        (document.querySelector("#billingAddressCity")).value =
          component.long_name;
        break;

      case "postal_town":

        var $pattern = /^(^[^(\\'\\<\\>\\\)]+$)/i
        var $isValid = $pattern.test(component.long_name);
        if ($isValid) {
            $('.billingAddressCity').addClass('auto-is-valid');
            $('.billingAddressCity').removeClass('auto-is-invalid');
        } else {
            $('.billingAddressCity').removeClass('auto-is-valid');
            $('.billingAddressCity').addClass('auto-is-invalid');
        }

        (document.querySelector("#billingAddressCity")).value =
          component.long_name;
        break;

      case "administrative_area_level_1": {
        if ($shippingCountrydefault.value == Resources.CHECKOUT_COUNTRY_US || $shippingCountrydefault.value == Resources.CHECKOUT_COUNTRY_CH) {
          if (billingState !== null) {
            billingState.value = component.short_name;
            $('.billingState').addClass('auto-is-valid');
            $('.billingState').removeClass('auto-is-invalid');
          } else {
            $('.billingState').removeClass('auto-is-valid');
            $('.billingState').addClass('auto-is-invalid');
          }
        }
        break;
      }

      case "administrative_area_level_2": {
        if ($shippingCountrydefault.value == Resources.CHECKOUT_COUNTRY_GB) {
          if (billingCounty !== null) {
            billingCounty.value = component.short_name;
            $('.billingState').addClass('auto-is-valid');
            $('.billingState').removeClass('auto-is-invalid');
          } else {
            $('.billingState').removeClass('auto-is-valid');
            $('.billingState').addClass('auto-is-invalid');
          }
        }
        break;
      }

      case "country": {
        (document.querySelector("#billingCountry")).value =
          component.short_name;
        break;
      }

    }
  }

  var $address1BillingValue = address1Billing;
  address1FieldBilling.value = $address1BillingValue.replace(/'/g, ' ');;
  postalFieldBilling.value = postcodeBilling;
  autoCompleteFields();
}

function checkForInput(element) {
  const $label = $(element).siblings('.field-label-wrapper');
  if ($(element).val().length > 0) {
    $label.addClass('input-has-value');
  } else {
    $label.removeClass('input-has-value');
  }
}

function autoCompleteFields() {
  $('input.input-wrapper-checkout,select.custom-select-box').each(function () {
    checkForInput(this);
  });
};
window.initAutocomplete()
