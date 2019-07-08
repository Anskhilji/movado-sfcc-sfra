(function () {
    var $el = '.video-wrapper';
    var isVideoPlaying = false;
    $($el).on('click', '.js-play-video', function (e) {
        e.preventDefault();
        var $this = $(this),
            $videoContainer = $this.closest($el),
            $videoContent = $videoContainer.find('.video-content'),
            $textContent = $videoContainer.closest('.content-item').find('.content-section'),
            video = $videoContainer.find('video')[0];

        video.play();
        video.addEventListener('play', function () {
            video.setAttribute('controls', 'controls');
            $videoContent.fadeOut('slow');
            if ($textContent) {
                $textContent.fadeOut('slow');
            }
            isVideoPlaying = !$videoContainer.hasClass('playing');
            $videoContainer.addClass('playing');
            if (isVideoPlaying) {
                isVideoPlaying = false;
            }
        });
        video.addEventListener('ended', function () {
            $videoContent.fadeIn('slow');
            if ($textContent) {
                $textContent.fadeIn('slow');
            }
            video.currentTime = 0;
            video.load(); // to show the poster image back with content
        // To stop replaying in IE
            video.pause();
            $videoContainer.removeClass('playing');
            if (video.hasAttribute('controls')) {
                video.removeAttribute('controls');
            }
        });
    });
}());
