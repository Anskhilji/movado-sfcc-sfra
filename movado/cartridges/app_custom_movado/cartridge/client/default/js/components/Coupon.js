var urlParams;
    (window.onpopstate = function () {
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.search.substring(1);
        urlParams = {};
        while (match = search.exec(query))
           urlParams[decode(match[1])] = decode(match[2]);
    })();

$(document).ready(function(){
    if(urlParams.popup_code) {
        var url = Resources.COUPONCODE_URL+'?popup_code=' + urlParams.popup_code
        $.ajax({
            type: "POST",
            url: url,
            data: "",
            success: function (response) {
            }
        });
    }
})