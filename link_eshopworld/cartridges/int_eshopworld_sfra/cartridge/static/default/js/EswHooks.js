'use strict';

function changeAjaxCall(dataObj) {
	$.ajax({
        type: 'get',
        url: dataObj.url,
        data: dataObj,
        success:function(response){
        	window.location.href=response.redirectUrl; 
        }
	});
}

function hideExtraCurrencies() {
	var country = $("#selected-country").attr('data-value');
	if(country) {
	$(".selectCurrency").hide();
	$(".selectCurrency .landing-link").each(function(){
		$(this).show();
		var connected = $(this).attr('data-connected');
		if(connected != country) {
			$(this).hide();
		}else {
			if(!$('.selectCurrency').is(':visible')) {
				$("#selected-currency").attr('data-value',$(this).attr('data-param'));
				$("#selected-currency").text($(this).attr('data-param'));
			}
			$(".selectCurrency").show();
			
		}
	});
	}
}
function updateCountryList () {	

    $('.btnCheckout').on('click', function (e) {
    	 e.preventDefault();
    	 $.ajax({
    		 type : 'get',
    		 url : $(this).attr('data-url'),
    		 data: '',
    		 success : function (response) {
    			 window.open(response.redirectURL,'_self');
    		 }
    	 });
    });
    $(document).on('click','.closeLandingPage', function() {
		$('.eswModal').hide();
		$('.modalBg').hide();
	});

    // set currency first before reload
    $('.esw-country-selector .selector a.landing-link').on('click', function (e) {
        e.preventDefault();
        var element = $(this).parents('.select-field');
        $(element).find('span').attr('data-value',$(this).attr('data-param'));
        $(element).find('.current-country .flag-icon').attr('class','flag-icon flag-icon-'+$(this).attr('data-param').toLowerCase());
        $(element).find('span').text($(this).text());
        $('.selector-active').removeClass('selector-active');
        $(this).parents('.active').removeClass('active');
    });
    
    $(document).on('click','.esw-btn',function(){
    	var country = $("#selected-country").attr('data-value');
  	  	var	currency = $("#selected-currency").attr('data-value');
  	  	var	language = $("#selected-locale").attr('data-value');    	
  	  	
    	if (country){
    		if(!currency){
    			currency = $("#selected-country").closest('.select-field').find('.country a:first').attr('data-currency');
    		}
    		if(!language){
    			language = $("#selected-country").closest('.select-field').find('.country a:first').attr('data-locale');
    		}
    	}else if (language){
    		if(!currency){
    			currency = $("#selected-locale").closest('.select-field').find('.country a:first').attr('data-currency');
    		}
    		if(!country){
    			country = $("#selected-locale").closest('.select-field').find('.country a:first').attr('data-country');
    		}
    	}else if (currency){
    		if(!country){
    			country = $("#selected-currency").closest('.select-field').find('.country a:first').attr('data-currency');
    		}
    		if(!language){
    			language = $("#selected-currency").closest('.select-field').find('.country a:first').attr('data-locale');
    		}
    	}
    	var dataObj = {
            	  'country': country,
            	  'currency': currency,
            	  'language': language,
            	  'url': $(this).attr('data-url'),
            	  'action':'Home-Show'
            	 };    	
    	changeAjaxCall(dataObj);
    });

    $(document).on('click','.selected-link',function(){
        var dataObj = {
            	  'country': $(this).attr('data-country'),
            	  'currency': $(this).attr('data-currency'),
            	  'language': $(this).attr('data-locale'),
            	  'url': $(this).attr('data-url'),
            	  'action': $('.page').data('action'),
            	  'queryString': $('.page').data('querystring')
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
    
    $(document).on('click',function(e){
		$('.esw-country-selector .selector').removeClass('active');
        $('.esw-country-selector .current-country').removeClass('selector-active');
    });
    
};
$(document).ready(function(){
	updateCountryList();
});