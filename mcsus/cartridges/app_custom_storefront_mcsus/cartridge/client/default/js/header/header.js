$('body').on('focus, keydown', ".search-field:visible", function (e) {
    if ($(this).val().length > 0) {
        $(".search-recomendation").fadeOut();
    } else {
        $(".search-recomendation").fadeIn();
    }
});
$(".search-field").on('click', function (e) {
    $(".search-recomendation").css('visibility', 'visible');
    $(".search-recomendation").fadeIn();
    e.stopPropagation();
});
$('body').on('click', function (e) {
    $(".search-recomendation").fadeOut();
});