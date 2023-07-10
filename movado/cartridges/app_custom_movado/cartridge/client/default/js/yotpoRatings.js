'use strict';

$(document).ready(function () {
    var $yotpoStarMain = $('.yotpo-stars-main');
    
    if ($yotpoStarMain.length > 0) {
        var $yotpoStarsRating  =  $('.yotpo-stars-rating');

        if ($yotpoStarsRating) {
            var $averageScore = $yotpoStarsRating.data('average-score');

            $yotpoStarMain.each(function() {

                if ($averageScore > 0.3 && $averageScore <= 0.7) {
                    $(this).empty();
                    $(this).append('<span class="yotpo-icon yotpo-icon-half-star rating-star pull-left"></span>' + '<span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>' + 
                    ' <span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>');
                } else if ($averageScore > 0.7 && $averageScore <= 1.2) {
                    $(this).empty();
                    $(this).append('<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + '<span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>' + 
                    ' <span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>');
                } else if ($averageScore > 1.2 && $averageScore <= 1.7) {
                    $(this).empty();
                    $(this).append('<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + '<span class="yotpo-icon yotpo-icon-half-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>' + 
                    ' <span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>');
                } else if ($averageScore > 1.7 && $averageScore <= 2.2) {
                    $(this).empty();
                    $(this).append('<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + '<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>' + 
                    ' <span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>');
                }  else if ($averageScore > 2.2 && $averageScore <= 2.7) {
                    $(this).empty();
                    $(this).append('<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + '<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon yotpo-icon-half-star rating-star pull-left"></span>' + 
                    ' <span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>');
                } else if ($averageScore > 2.7 && $averageScore <= 3.2) {
                    $(this).empty();
                    $(this).append('<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + '<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon  yotpo-icon-star rating-star pull-left"></span>' + 
                    ' <span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>');
                } else if ($averageScore > 3.2 && $averageScore <= 3.7) {
                    $(this).empty();
                    $(this).append('<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + '<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon  yotpo-icon-star rating-star pull-left"></span>' + 
                    ' <span class="yotpo-icon yotpo-icon-half-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>');
                } else if ($averageScore > 3.7 && $averageScore <= 4.2) {
                    $(this).empty();
                    $(this).append('<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + '<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon  yotpo-icon-star rating-star pull-left"></span>' + 
                    ' <span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon yotpo-icon-empty-star rating-star pull-left"></span>');
                } else if ($averageScore > 4.2 && $averageScore <= 4.7) {
                    $(this).empty();
                    $(this).append('<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + '<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon  yotpo-icon-star rating-star pull-left"></span>' + 
                    ' <span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon yotpo-icon-half-star rating-star pull-left"></span>');
                } else if ($averageScore > 4.7 && $averageScore <= 5) {
                    $(this).empty();
                    $(this).append('<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + '<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon  yotpo-icon-star rating-star pull-left"></span>' + 
                    ' <span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>' + 
                    '<span class="yotpo-icon yotpo-icon-star rating-star pull-left"></span>');
                }
            });
        }
    }
});
