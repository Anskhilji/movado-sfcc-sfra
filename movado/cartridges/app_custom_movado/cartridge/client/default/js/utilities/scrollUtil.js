/*
 * Function to scroll to first invalid field 
 * */
function scrollInvalidFields(elemetSelector, positionAdjustment, time) {
  $('html, body').animate({
     scrollTop: $(elemetSelector).find('.is-invalid').first().offset().top + positionAdjustment
       }, time);
}

module.exports = {
    scrollInvalidFields: scrollInvalidFields
};