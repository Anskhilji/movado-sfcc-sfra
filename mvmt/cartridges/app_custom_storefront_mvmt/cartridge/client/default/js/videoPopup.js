'use strict';

$(document).ready(function () {
    var $videoSrc;
    $(document).on('click', '.video-btn', function() {
        $videoSrc = $(this).data( "src" );
    });

    $(document).on('shown.bs.modal', '#youtubeVideoModal', function (e) {
        $("#youtubeVideo").attr('src', $videoSrc + "?autoplay=1&amp;modestbranding=1&amp;showinfo=0" );
    })

    $(document).on('hide.bs.modal', '#youtubeVideoModal', function (e) {
        $("#youtubeVideo").attr('src', $videoSrc);
    })
});