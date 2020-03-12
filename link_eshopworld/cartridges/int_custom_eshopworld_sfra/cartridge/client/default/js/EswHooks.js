'use strict';

function changeAjaxCall (dataObj) {
    $.ajax({
        type: 'get',
        url: dataObj.url,
        data: dataObj,
        success:function(response){
            location.reload();
        }
    });
}

module.exports = function () {
    $('.btnCheckout').on('click', function (e) {
        e.preventDefault();
        $.ajax({
            type : 'get',
            url : Urls.preparePreOrderRequest,
            data: '',
            success : function (response) {
                window.open(response.redirectURL, '_self');
            }
        });
   });

   $(document).on('click', '.closeLandingPage', function () {
       $('.eswModal').hide();
       $('.modalBg').hide();
   });

   // set currency first before reload
   $('.esw-country-selector .selector a.landing-link').on('click', function (e) {
       e.preventDefault();
       var element = $(this).parents('.select-field');
       $(element).find('span').attr('data-value', $(this).attr('data-param'));
       $(element).find('.current-country .flag-icon').attr('class', 'flag-icon flag-icon-' + $(this).attr('data-param').toLowerCase());
       $(element).find('span').text($(this).text());
       $('.selector-active').removeClass('selector-active');
       $(this).parents('.active').removeClass('active');
       
   });

   $(document).on('click', '.esw-btn', function () {
       var dataObj = {
           'country': $("#selected-country").attr('data-value'),
           'currency': $("#selected-currency").attr('data-value'),
           'language': $("#selected-locale").attr('data-value'),
           'url': $(this).attr('data-url')
       };
       changeAjaxCall(dataObj);
   });

   $(document).on('click', '.selected-link', function () {
       var dataObj = {
           'country': $(this).attr('data-country'),
           'currency': $(this).attr('data-currency'),
           'language': $(this).attr('data-locale'),
           'url': $(this).attr('data-url')
       };
       changeAjaxCall(dataObj);
   });

   $('.esw-country-selector .current-country').on('click', function (e) {
       e.stopPropagation();
       var siblingSelector = $(this).siblings('.selector');
       siblingSelector.toggleClass('active');
       $(this).toggleClass('selector-active');
       $('.esw-country-selector .selector').not(siblingSelector).removeClass('active');
       $('.esw-country-selector .current-country').not(this).removeClass('selector-active');
   });

   $(document).on('click', function (e) {
       $('.esw-country-selector .selector').removeClass('active');
       $('.esw-country-selector .current-country').removeClass('selector-active');
   });
};
