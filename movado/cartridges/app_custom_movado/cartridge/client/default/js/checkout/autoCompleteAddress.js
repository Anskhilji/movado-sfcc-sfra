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
  var shippingCountrydefault = document.querySelector("#shippingCountrydefault");
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
        if (shippingCountrydefault.value == 'US') {
          var $pattern = /^(^(?!0{5})[0-9][0-9]{4}$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/i
          var $isValid = $pattern.test(component.short_name);
          if ($isValid) {
              $('.shippingZipCode').addClass('is-valid');
              $('.shippingZipCode').removeClass('is-invalid');
          } else {
              $('.shippingZipCode').removeClass('is-valid');
              $('.shippingZipCode').addClass('is-invalid');
          }
        } else if (shippingCountrydefault.value == 'GB') {
          var $pattern = /^(GIR 0AA)|((([A-Za-z-[QVX]][0-9][0-9]?)|(([A-Za-z-[QVX]][A-Za-z-[IJZ]][0-9][0-9]?)|(([A-Za-z-[QVX‌]][0-9][A-HJKSTUWa-hjkstuw])|([A-Za-z-[QVX]][A-Za-z-[IJZ]][0-9][ABEHMNPRVWXYabehmnprvwxy]))))\s?[0-9][A-Za-z-[C‌IKMOV]]{2})/i
          var $isValid = $pattern.test(component.short_name);
          if ($isValid) {
              $('.shippingZipCode').addClass('is-valid');
              $('.shippingZipCode').removeClass('is-invalid');
          } else {
              $('.shippingZipCode').removeClass('is-valid');
              $('.shippingZipCode').addClass('is-invalid');
          }
        }

        postcode = `${component.short_name}`;
        break;
      }

      case "locality":
        var $pattern = /^(^[^(\\'\\<\\>\\\)]+$)/i
        var $isValid = $pattern.test(component.long_name);
        if ($isValid) {
            $('.shippingAddressCity').addClass('is-valid');
            $('.shippingAddressCity').removeClass('is-invalid');
        } else {
            $('.shippingAddressCity').removeClass('is-valid');
            $('.shippingAddressCity').addClass('is-invalid');
        }

        (document.querySelector("#shippingAddressCity")).value =
          component.long_name;
        break;

      case "postal_town":

        var $pattern = /^(^[^(\\'\\<\\>\\\)]+$)/i
        var $isValid = $pattern.test(component.long_name);
        if ($isValid) {
            $('.shippingAddressCity').addClass('is-valid');
            $('.shippingAddressCity').removeClass('is-invalid');
        } else {
            $('.shippingAddressCity').removeClass('is-valid');
            $('.shippingAddressCity').addClass('is-invalid');
        }

        (document.querySelector("#shippingAddressCity")).value =
          component.long_name;
        break;

      

      case "administrative_area_level_1": {
        if (billingState !== null) {
          billingState.value =
          component.short_name;
          $('.shippingState').addClass('is-valid');
          $('.shippingState ').removeClass('is-invalid');
        } else {
          $('.shippingState').removeClass('is-valid');
          $('.shippingState').addClass('is-invalid');
        }
        break;
      }
  
      case "administrative_area_level_2": {
        if (billingCounty !== null) {
            billingCounty.value =
            component.short_name;
            $('.shippingState').addClass('is-valid');
            $('.shippingState ').removeClass('is-invalid');
        } else {
          $('.shippingState').removeClass('is-valid');
          $('.shippingState').addClass('is-invalid');
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
        if (shippingCountrydefault.value == 'US') {
          var $pattern = /^(^(?!0{5})[0-9][0-9]{4}$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/i
          var $isValid = $pattern.test(component.short_name);
          if ($isValid) {
              $('.billingZipCode').addClass('is-valid');
              $('.billingZipCode').removeClass('is-invalid');
          } else {
              $('.billingZipCode').removeClass('is-valid');
              $('.billingZipCode').addClass('is-invalid');
          }
        } else if (shippingCountrydefault.value == 'GB') {
          var $pattern = /^(GIR 0AA)|((([A-Za-z-[QVX]][0-9][0-9]?)|(([A-Za-z-[QVX]][A-Za-z-[IJZ]][0-9][0-9]?)|(([A-Za-z-[QVX‌]][0-9][A-HJKSTUWa-hjkstuw])|([A-Za-z-[QVX]][A-Za-z-[IJZ]][0-9][ABEHMNPRVWXYabehmnprvwxy]))))\s?[0-9][A-Za-z-[C‌IKMOV]]{2})/i
          var $isValid = $pattern.test(component.short_name);
          if ($isValid) {
              $('.billingZipCode').addClass('is-valid');
              $('.billingZipCode').removeClass('is-invalid');
          } else {
              $('.billingZipCode').removeClass('is-valid');
              $('.billingZipCode').addClass('is-invalid');
          }
        }
        postcodeBilling = `${component.long_name}`;
        break;
      }

      case "locality":

        var $pattern = /^(^[^(\\'\\<\\>\\\)]+$)/i
        var $isValid = $pattern.test(component.long_name);
        if ($isValid) {
            $('.billingAddressCity').addClass('is-valid');
            $('.billingAddressCity').removeClass('is-invalid');
        } else {
            $('.billingAddressCity').removeClass('is-valid');
            $('.billingAddressCity').addClass('is-invalid');
        }

        (document.querySelector("#billingAddressCity")).value =
          component.long_name;
        break;

      case "postal_town":

        var $pattern = /^(^[^(\\'\\<\\>\\\)]+$)/i
        var $isValid = $pattern.test(component.long_name);
        if ($isValid) {
            $('.billingAddressCity').addClass('is-valid');
            $('.billingAddressCity').removeClass('is-invalid');
        } else {
            $('.billingAddressCity').removeClass('is-valid');
            $('.billingAddressCity').addClass('is-invalid');
        }

        (document.querySelector("#billingAddressCity")).value =
          component.long_name;
        break;

      case "administrative_area_level_1": {
        if (billingState !== null) {
          billingState.value =
          component.short_name;
          $('.billingState').addClass('is-valid');
          $('.billingState ').removeClass('is-invalid');
        } else {
          $('.billingState').removeClass('is-valid');
          $('.billingState').addClass('is-invalid');
        }
        break;
      }

      case "administrative_area_level_2": {
        if (billingCounty !== null) {
          billingCounty.value =
          component.short_name;
          $('.billingState').addClass('is-valid');
          $('.billingState ').removeClass('is-invalid');
        } else {
          $('.billingState').removeClass('is-valid');
          $('.billingState').addClass('is-invalid');
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
