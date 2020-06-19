if ($('#welcomeMat').length) {
    var isGeoLocation = $('#isGeoLocation').val() !== null ? $('#isGeoLocation').val() : 'null';
    if (isGeoLocation !== 'null') {
        var dataUrl = $('#isGeoLocation').data('url');
        var dataCountry = $('#isGeoLocation').data('country');
        if (isGeoLocation === 'true') {
            $('#welcomeMat .esw-body-wrapper').removeClass('d-none');
            $('#welcomeMat .geolocation').removeClass('d-none');
            $('#welcomeMat .geolocation .esw-btn').attr('data-url', dataUrl);
            $('#welcomeMat .geolocation h3 span').html(dataCountry);
        } else {
            $('#welcomeMat .not-geolocation-country').removeClass('d-none');
            $('#welcomeMat .not-geolocation-country .esw-btn').attr('data-url', dataUrl);
            $('#welcomeMat .not-geolocation-country h3 span').html(dataCountry);
        }
        $('#add-shipping-country-message').html($('#shipping-country-message').html());
    }
    $('#welcomeMat .current-state').html($('.welcomemat-current-country').html());
    $('#welcomeMat .current-website').html($('.welcomemat-current-shipping-country').html());
    $('#welcomeMat .site-matched-country').html($('.welcomemat-current-site-matched-country').html());
    $('#welcomeMat .flag-icon').addClass($('.welcomemat-country-flag-icon').html());
    $('#welcomeMat').modal({
        backdrop: 'static',
        keyboard: false
    });
  // add logic to make overlay non-clickable when modal is opened
}
$('.continue-here').on('click', function () {
    var endPointUrl = $(this).data('continue');
    $.ajax({
        url: endPointUrl,
        method: 'GET'
    });
});

function DaysToMilliSeconds(durationInDays) {
    return durationInDays*24*60*60*1000;
}


function createCookie(cookieName, cookieValue, duration) {
    var currentDate = new Date();
    currentDate.setTime(currentDate.getTime() + duration);
    var expires = 'expires=' + currentDate.toGMTString();
    document.cookie = cookieName + '=' + cookieValue + ';' + expires + '; SameSite=Lax';
}


$('.country-selector select').on('change', function (e) {
    e.preventDefault();
    var DaysMilliSecondsDuration = DaysToMilliSeconds(Resources.COOKIE_EXPIRY_TIME_WELCOME_MAT);
    var redirect = $('option:selected', $(this)).data('value');
    createCookie('redirectTo', redirect, DaysMilliSecondsDuration);
    location.href = redirect;
});

$('.redirection-flag-selector .want-to-ship').on('click', function (e) {
    e.preventDefault();
    var DaysMilliSecondsDuration = DaysToMilliSeconds(Resources.COOKIE_EXPIRY_TIME_WELCOME_MAT);
    var redirect = $('.welcomemat-current-site-url').data('currentsiteurl');
    createCookie('redirectTo', redirect, DaysMilliSecondsDuration);
    location.href = redirect;
});
