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

    address1Field.focus();
    address1FieldBilling.focus();
  
    // When the user selects an address from the drop-down, populate the
    // address fields in the form.
    autocomplete.addListener("place_changed", fillInAddress);
    autocompleteBilling.addListener("place_changed", fillInAddressBilling);
}


function fillInAddress(){
  // Get the place details from the autocomplete object.
  const place = autocomplete.getPlace();
  var address1 = "";
  var postcode = "";
  var shippingCountrydefault = document.querySelector("#shippingCountrydefault");

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
        address1 += component.short_name;
        break;
      }

      case "postal_code": {
        postcode = `${component.long_name}${postcode}`;
        break;
      }

      case "postal_code_suffix": {
        postcode = `${postcode}-${component.long_name}`;
        break;
      }

      case "locality":
        (document.querySelector("#shippingAddressCity")).value =
          component.long_name;
        break;

      case "administrative_area_level_1": {
        (document.querySelector("#shippingState")).value =
          component.short_name;
        break;
      }
    }
  }

  address1Field.value = address1;
  postalField.value = postcode;

  // After filling the form with address components from the Autocomplete
  // prediction, set cursor focus on the second address line to encourage
  // entry of subpremise information such as apartment, unit, or floor number.
  address2Field.focus();
}

function fillInAddressBilling(){
  // Get the place details from the autocomplete object.
  const place = autocomplete.getPlace();
  var address1Billing = "";
  var postcodeBilling = "";

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
        address1Billing += component.short_name;
        break;
      }

      case "postal_code": {
        postcodeBilling = `${component.long_name}${postcodeBilling}`;
        break;
      }

      case "postal_code_suffix": {
        postcodeBilling = `${postcodeBilling}-${component.long_name}`;
        break;
      }

      case "locality":
        (document.querySelector("#billingAddressCity")).value =
          component.long_name;
        break;

      case "administrative_area_level_1": {
        (document.querySelector("#billingState")).value =
          component.short_name;
        break;
      }

      case "country": {
        (document.querySelector("#billingCountry")).value =
          component.short_name;
        break;
      }

    }
  }

  address1FieldBilling.value = address1Billing;
  postalFieldBilling.value = postcodeBilling;

  // After filling the form with address components from the Autocomplete
  // prediction, set cursor focus on the second address line to encourage
  // entry of subpremise information such as apartment, unit, or floor number.
  address2FieldBilling.focus();
}
  
window.initAutocomplete()
