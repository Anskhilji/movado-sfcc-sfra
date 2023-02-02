var processInclude = require('base/util');

processInclude(require('movado/storeLocator/storeLocator'));

// function openSotreLocator() {

// }

$('.store-sidebar-link').click(function(){
    $('.store-sidebar').addClass('show');
    $('.store-Locator-overlayer').addClass('d-block');
});

$('.store-sidebar-header-close').click(function(){
    $('.store-sidebar').removeClass('show');
    $('.store-Locator-overlayer').removeClass('d-block');
});

$('.filter-button').click(function(){
    $('.store-sidebar').addClass('hide-scroll');
    $('.radius-sidebar').addClass('show');
});

$('.radius-sidebar-header-title').click(function(){
    $('.store-sidebar').removeClass('hide-scroll');
    $('.radius-sidebar').removeClass('show');
});

$('.store-Locator-overlayer').click(function(){
    $('.radius-sidebar').removeClass('show');
    $('.store-sidebar').removeClass('hide-scroll');
    $('.store-sidebar').removeClass('show');
    $('.store-Locator-overlayer').removeClass('d-block');
});


$('.store-sidebar-card .select-time').each(function() {
    $(this).on('click', function() {
        $(this).siblings('.morecontent-wrapper').css('display', 'inline');

        $('.select-time-dropdwon').toggleClass('show')
    });
});