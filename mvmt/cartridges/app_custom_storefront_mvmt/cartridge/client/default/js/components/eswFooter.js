'use strict';

var eswFooterSelector = $('.esw-country-selector-footer');

$(document).ready(function () {
    var eswFooterUrl = eswFooterSelector.data('url');
    $.ajax({
        url: eswFooterUrl,
        method: 'get',

        success: function (response) {
            if (response) {
                eswFooterSelector.append(response);
            }
        }
    });
});

$(document).on('click','a.selected-link', function () {
    var locale = $(this).attr('data-locale').split('_');
    var dataObj = {
              'country': $(this).attr('data-country'),
              'currency': $(this).attr('data-currency'),
              'language': locale[0],
              'url': $(this).attr('data-url'),
              'action': $('.page').data('action'),
              'queryString': $('.page').data('querystring')
             };
    changeAjaxCall(dataObj);
});

function changeAjaxCall(dataObj) {
	$.ajax({
        type: 'get',
        url: dataObj.url,
        data: dataObj,
        success:function(response){
        	if(dataObj.changeAddressAjax) {
        		alert(dataObj.successMsg);
            	window.location.href=dataObj.redirect; 
        	}else {
        		window.location.href=response.redirectUrl;
        	}
        }
	});
}

$('.esw-country-selector-footer').hover(

    function () {
        $('.esw-country-selector').addClass('show');
        $('.dropdown-country-selector').addClass('show');
    },

    function () {
        $('.esw-country-selector').removeClass('show');
        $('.dropdown-country-selector').removeClass('show');
    }
);