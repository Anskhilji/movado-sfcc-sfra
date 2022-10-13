'use strict';
var mediumWidth = 992;

$(function() {
    $('.smartgiftpopup .close-smart-gift').bind('click', function(e) {
        e.stopPropagation();
        $(this).parents('.custom-tooltipsmart').hide();
        $('.showtooltipSmart').removeClass('active');
    });

    $('.smartgiftpopup .smartgift-btn-popup').on('click', function(e) {
        var $windowWidth = $(window).width();

        if ($windowWidth < mediumWidth) {
            $(this).addClass('active');
            $('.custom-tooltipsmart').show();
        }
    });

    $('.smartgiftpopup .smartgift-btn-popup').hover(
        function () {
            var $windowWidth = $(window).width();

            if ($windowWidth > mediumWidth){
                $('.showtooltipSmart').addClass('active');
                $('.custom-tooltipsmart').show();
            }
        },

        function () {
            var $windowWidth = $(window).width();

            if ($windowWidth > mediumWidth){
                $('.showtooltipSmart').removeClass('active');
                $('.custom-tooltipsmart').hide();
            }
        }
    );
});

// Custom start: Listrak persistent popup
$(document).on('click','.listrak-popup', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var isContainListrakPopup = e.target.closest('.listrak-popup');
    var targetEl = e.target;
    var isTargetContain = targetEl.classList.contains('close-icon-popup');
    if (isContainListrakPopup && !isTargetContain) {
        var listrakPersistenPopupUrl = document.querySelector('.listrak-persistent-url');
        var url = listrakPersistenPopupUrl.dataset.listrakUrl;
        console.log(url);
        $.ajax({
            url: url,
            method: 'GET',
            success: function (response) {
                if (response.success == true) {
                    var interval = setInterval(function() {
                        if (typeof _ltk != "undefined" && typeof _ltk.Popup != "undefined") {
                            _ltk.Popup.openManualByName(response.popupID);
                            clearInterval(interval);
                        }
                    }, 1000);
                }
            },
            error: function () {
                $.spinner().stop();
            }
        });
    }
});

$(document).on('click','.close-icon-popup', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var isContainListrakPopup = e.target.closest('.listrak-popup');
    var targetEl = e.target;
    var isTargetContain = targetEl.classList.contains('close-icon-popup');
    if (isContainListrakPopup && isTargetContain) {
        sessionStorage.setItem("listrakPersistenPopup", "false");
        isContainListrakPopup.remove();
    }
});

window.onload = () => {
    var listrakPopup = document.querySelector('.listrak-popup');
    var listrakPopupSearchResult = document.querySelector('.listrak-popup-search-result');
    var listrakPopupProductDetail = document.querySelector('.listrak-popup-product-detail');
    var data = sessionStorage.getItem("listrakPersistenPopup");
    console.log(data);
    console.log(listrakPopupSearchResult);
    if (data == null) {
        var isListrakPopupContain = listrakPopup.classList.contains('listrak-persistent-popup');
    
        if (isListrakPopupContain) {
            listrakPopup.classList.remove('listrak-persistent-popup');
        }
    }
    if (listrakPopupSearchResult) {
        var mediumWidth = 992;
        var $windowWidth = $(window).width();
        if ($windowWidth < mediumWidth) {
            listrakPopup.classList.add('button-search-result');
        }
    }
    if (listrakPopupProductDetail) {
        var mediumWidth = 992;
        var $windowWidth = $(window).width();
        if ($windowWidth < mediumWidth) {
            listrakPopup.classList.add('button-product-detail');
        }
    }
};
// Custom End: Listrak persistent popup