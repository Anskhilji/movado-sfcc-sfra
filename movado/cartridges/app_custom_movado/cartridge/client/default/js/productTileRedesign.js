'use strict';

$(document).ready(function() {
    $(".truncate-text-wrapper").each(function(){
        var productText = $(this).text();
        var textLenght = $(this).text().length;
        if (textLenght > 40) {
            var shortText = jQuery.trim(productText).substring(0, 40).split(" ").slice(0, -1).join(" ") + "...";
            $(this).text(shortText);
        }
    });    
});

$(document).ready(function() {
    $(".product-name").removeClass("truncate-text-wrapper");
    $(".product-name").addClass("truncate-text-wrapper-2");

    
    $(".truncate-text-wrapper-2").each(function(){
        var productText = $(this).text();
        var textLenght = $(this).text().length;
        if (textLenght > 40) {
            var shortText = jQuery.trim(productText).substring(0, 40).split(" ").slice(0, -1).join(" ") + "...";
            $(this).text(shortText);
        }
    });    
});