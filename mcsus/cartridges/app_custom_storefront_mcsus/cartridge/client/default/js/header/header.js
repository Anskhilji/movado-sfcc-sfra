var $mobileMenuGroup = $('.main-menu-mobile .menu-group');

$('body').on('focus, keydown', ".search-field:visible", function (e) {
    if ($(this).val().length > 0) {
        $(".search-recomendation").fadeOut();
    } else {
        $(".search-recomendation").fadeIn();
        $mobileMenuGroup.addClass('d-none');
        $mobileMenuGroup.hide();
    }
});
$(".search-field").on('click', function (e) {
    if ($(this).val() === '') {
        $(".search-recomendation").css('visibility', 'visible');
        $(".search-field").css('border-radius', '3px 3px 0 0');
        $(".search-recomendation").fadeIn();
        $mobileMenuGroup.addClass('d-none'); //if we need search on mobile 
        $mobileMenuGroup.hide();
        e.stopPropagation();
    }
});

// If you move your mouse away from the search flyout, the search flyout closes
$('.search').on('mouseleave', function(){
    $('.search-recomendation').hide();
    $mobileMenuGroup.removeClass('d-none'); //if we need search on mobile
    $(this).focusout();
});
$('.search-recomendation').on('mouseenter', function(e){
    $('.search').unbind("mouseleave");
});
$('.search-recomendation').on('mouseleave', function(e){
    $('.search').on('mouseleave', function(){
        $('.search-recomendation').hide();
        $mobileMenuGroup.removeClass('d-none'); //if we need search on mobile
        $mobileMenuGroup.show();
        $(this).focusout();
    });
});
// end


$('body').on('click', function (e) {
    $(".search-recomendation").fadeOut();
    $(".search-field").css('border-radius', '3px');
    $('.menu-group').show();
});
$('.navbar-nav').on('click', '.close-button', function (e) {
    $('.modal-background').removeClass('popup-modal');
});
$('.navbar-toggler').click(function (e) {
    $('.modal-background').addClass('popup-modal');
});