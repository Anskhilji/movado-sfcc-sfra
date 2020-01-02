'use strict';

$(document).ready(function () {
    function toggleIcon(e) {
        $(e.target)
            .prev('.panel-heading')
            .find(".more-less")
            .toggleClass('fa-plus fa-minus');
    }
    $('.panel-group').on('hidden.bs.collapse', toggleIcon);
    $('.panel-group').on('shown.bs.collapse', toggleIcon);
    $('.tab-pane-control:first').removeClass('fade in');
    $('.faq-control-bar-inner li').on('click', function(){
        $(this).siblings().removeClass('is-active');
        $(this).addClass('is-active');
        
        $('.tab-pane-control').hide();
        
        var id = $(this).children().attr('href');
        $(id).show();
    });
});

