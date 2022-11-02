$(document).ready(function () {
    $('#month').on('change', function () {
        var selectedMonth = $(this).find(":selected");
        var id = selectedMonth[0].id;
        var filterId = id.split('-');
        var birthday = $(this).data('birthdate');
        var year = new Date().getFullYear();
        var lastDateOfMonth = new Date(year, filterId[1], 0).getDate();
        var filterDays = birthday.filter(function (data) {
            return lastDateOfMonth === 28 ? data.htmlValue <= (lastDateOfMonth + 1) : data.htmlValue <= lastDateOfMonth;
        });
        $("#date").empty();
        filterDays.forEach(item => {
            $("#date").append('<option id="day-' + item.id + '" value="' + item.htmlValue + '">' + item.label + '</option>');
        });
    });

});
