/*
 * Function to scroll to first invalid field 
 * */
function scrollInvalidFields(elemetSelector, positionAdjustment, time) {
  $('html, body').animate({
     scrollTop: $(elemetSelector).find('.is-invalid').first().offset().top + positionAdjustment
       }, time);
}

function scrollToTopError(positionAdjustment, time) {
  $('html, body').animate({
     scrollTop: $('.checkout-form-error').offset().top + positionAdjustment
       }, time);
}

function scrollPaymentSection(container, positionAdjustment) {
  $('html, body').animate({
    scrollTop:  $(container).offset().top - positionAdjustment
  });
}

module.exports = {
    scrollInvalidFields: scrollInvalidFields,
    scrollPaymentSection: scrollPaymentSection,
    scrollToTopError: scrollToTopError
};