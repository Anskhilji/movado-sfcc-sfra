'use strict';

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
/**
 * Does Ajax call to convert the prices and 
 * Injects it into the DOM.
 * @param {jQuery} $eswPriceSelector - DOM selector for price 
 */
function eswConvertPrice($eswPriceSelector) {
	var $remoteIncludeElement = $eswPriceSelector.children('wainclude')[0];
    if (!!$remoteIncludeElement) {
    	var getPriceUrl = $remoteIncludeElement.getAttribute('url');
        $.ajax({
            url: getPriceUrl,
            method: 'GET',
            success: function (html) {
            	$eswPriceSelector.html(html);
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
    			var locale = $("#selected-country").closest('.select-field').find('.country a:first').attr('data-locale').split('_');
    			language = locale[0];
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
    			var locale = $("#selected-country").closest('.select-field').find('.country a:first').attr('data-locale').split('_');
    			language = locale[0];
    		}
    	}
    	var dataObj = {
            	  'country': country,
            	  'currency': currency,
            	  'language': language,
				  'url': $(this).attr('data-url'),
				  // Custom Start: Changed the  hard coded action from 'Home-Show' to respective action and added the queryString atribute
            	  'action': $('.page').data('action'),
				  'queryString': $('.page').data('querystring')
				   // Custom End 
            	 };    	
    	changeAjaxCall(dataObj);
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
    $(document).on('change','#shippingCountrydefault',function(){
    	var selectedData = {'country' : $('#shippingCountrydefault').val().toUpperCase(),
    						'url'	:   $('#shippingCountrydefault').attr('data-url')
    					};
    	$.ajax({
            type: 'get',
            url: selectedData.url,
            data: selectedData,
            success:function(response){
            	if(response.success == false){
            		return;
            	} else {
            		var dataObj = {
                        	  'country': response.country,
                        	  'currency': response.currency,
                        	  'language': response.language,
                        	  'url'		: response.url,
                        	  'action': $('.page').data('action'),
                        	  'queryString': $('.page').data('querystring'),
                        	  'redirect'	: response.redirect,
                        	  'successMsg' : response.successMsg,
                        	  'changeAddressAjax' : true
                        	 };
            		changeAjaxCall(dataObj);
              	} 
            }
    	});
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
    $('body').on('product:afterAttributeSelect', function (e, response) {
	    if (response.data.product.isProductRestricted) {
	    	$('.modal.show').find('button.update-cart-product-global').addClass('d-none');
	    	$('.modal.show').find('.price').addClass('d-none');
	    	$('.modal.show').find('.product-not-available-msg').removeClass('d-none');
	    } else {
	    	$('.modal.show').find('button.update-cart-product-global').removeClass('d-none');
	    	$('.modal.show').find('.price').removeClass('d-none');
	    	$('.modal.show').find('.product-not-available-msg').addClass('d-none');
	    }
	    // Remote Include call For List Price
	    var $eswListPriceSelector = $('.modal.show').find('.eswListPrice');
	    eswConvertPrice($eswListPriceSelector);

	    // Remote Include call For Sales Price
	    var $eswPriceSelector = $('.modal.show').find('.eswPrice');
	    eswConvertPrice($eswPriceSelector);
	});
    $('body').on('shown.bs.modal', '#editProductModal', function () {
    	var eswListPriceInterval = setInterval(function () {
    	    // Remote Include call For List Price
    	    var $eswListPriceSelector = $('.modal.show').find('.eswListPrice');
    	    if ($eswListPriceSelector.length > 0) {
    	    	eswConvertPrice($eswListPriceSelector);
    	    	clearInterval(eswListPriceInterval);
    	    }
    	}, 300);

    	var eswPriceInterval = setInterval(function () {
    	    // Remote Include call For Sales Price
    	    var $eswPriceSelector = $('.modal.show').find('.eswPrice');
    	    if ($eswPriceSelector.length > 0) {
    	    	eswConvertPrice($eswPriceSelector);
    	    	clearInterval(eswPriceInterval);
    	    }
    	}, 300);
    });
};

$(document).ready(function() {
    updateCountryList();
});