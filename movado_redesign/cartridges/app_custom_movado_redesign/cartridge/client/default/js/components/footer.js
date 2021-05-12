$(document).on('ready',function () {
    $('.collapse-inner.mCustomScrollbar').mCustomScrollbar();
});

$('footer .esw-country-selector').on('click', function(){
    $('footer .esw-country-selector.active').not(this).removeClass('active');
    $(this).toggleClass('active');
 });

$('footer .esw-country-selector').each(function() {
    $(this).click(function() {
      if ($(this).hasClass( 'active' )) {
        $(this).removeClass( 'active' );
      } else {
          $(this).addClass( 'active' );
      }
    });
});

$(document).mouseup(function(e) {
    var container = $('footer .esw-country-selector');

    // if the target of the click isn't the container nor a descendant of the container
    if (!container.is(e.target) && container.has(e.target).length === 0) {
        $('footer .esw-country-selector').removeClass('active');
    }
});