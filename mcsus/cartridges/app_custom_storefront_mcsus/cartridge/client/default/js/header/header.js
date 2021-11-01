$('body').on('focus, keydown', ".search-field:visible", function (e) {
    if ($(this).val().length > 0) {
        $(".search-recomendation").fadeOut();
    } else {
        $(".search-recomendation").fadeIn();
    }
});
$(".search-field").on('click', function (e) {
    if ($(this).val() === '') {
        $(".search-recomendation").css('visibility', 'visible');
        $(".search-field").css('border-radius', '3px 3px 0 0');
        $(".search-recomendation").fadeIn();
        e.stopPropagation();
    }
});
$('body').on('click', function (e) {
    $(".search-recomendation").fadeOut();
    $(".search-field").css('border-radius', '3px');
});
$('.navbar-nav').on('click', '.close-button', function (e) {
    $('.modal-background').removeClass('popup-modal');
    
  });
  $('.navbar-toggler').click(function (e) {
    $('.modal-background').addClass('popup-modal');
  });