if ($('#welcomeMat').length) {
    $('#welcomeMat .current-state').html($('.welcomemat-current-country').html());
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

$('.country-selector select').on('change', function (e) {
    var redirect = $('option:selected', $(this)).data('value');
    location.href = redirect;
});
