'use strict';

$(document).ready(function () {
    var $videoSrc;
    $('.video-btn').click(function() {
        $videoSrc = $(this).data( "src" );
    });

    $('#youtubeVideoModal').on('shown.bs.modal', function (e) {
        $("#youtubeVideo").attr('src', $videoSrc + "?autoplay=1&amp;modestbranding=1&amp;showinfo=0" );
    })

    $('#youtubeVideoModal').on('hide.bs.modal', function (e) {
        $("#youtubeVideo").attr('src', $videoSrc);
    })
});