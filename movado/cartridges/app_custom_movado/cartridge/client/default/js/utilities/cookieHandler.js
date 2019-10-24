function saveCookie(cookieName, cookieValue, cookieDuration) {
  var currentDate = new Date();
  currentDate.setTime(currentDate.getTime() + (cookieDuration*24*60*60*1000));
  var expires = "expires=" + currentDate.toGMTString();
  document.cookie = cookieName + "=" + cookieValue + ";" + expires + ";path=/";
}

function getCookie(cookieName) {
  var name = cookieName + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var cookieArray = decodedCookie.split(';');
  for (var i = 0; i < cookieArray.length; i++) {
    var cookie = cookieArray[i];
    while (cookie.charAt(0) == ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(name) == 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return "";
}

function isEmptyCookie(cookieName) {
  var cookie = getCookie(cookieName);
  if (cookie != "") {
    return true;
  } else {
     return false;
  }
}

module.exports = {
    saveCookie: saveCookie,
    getCookie: getCookie,
    isEmptyCookie: isEmptyCookie
};