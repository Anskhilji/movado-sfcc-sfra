'use strict';

function getCookie(cookieName) {
    var cookies = request.getHttpCookies();
    var redirectCookie = null;
    for (var i = 0; i < cookies.cookieCount; i++) {
        var cookie = cookies[i];
        if (cookie.name.equals(cookieName)) {
            redirectCookie = cookie;
            break;
        }
    } 
    return redirectCookie;
}

module.exports = {
    getCookie: getCookie
};