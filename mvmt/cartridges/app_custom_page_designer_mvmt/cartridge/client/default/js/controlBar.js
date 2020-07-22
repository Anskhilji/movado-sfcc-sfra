$(document).ready(function() {
    $(document).on('click', '.blog-control-bar-btn', function() {
        $('.blog-control-bar-inner').addClass('active');
    });
    
    $(document).on('click', '.blog-control-bar-inner-btn', function() {
        $('.blog-control-bar-inner').removeClass('active');
    });
});