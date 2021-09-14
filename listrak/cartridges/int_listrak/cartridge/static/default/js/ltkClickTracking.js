(function (d) {
    if (document.addEventListener) document.addEventListener('ltkAsyncListener', d);
    else {
        e = document.documentElement; e.ltkAsyncProperty = 0; e.attachEvent('onpropertychange', function (e) {
            if (e.propertyName === 'ltkAsyncProperty') { d(); }
        });
    }
}(function () {
    try {
		/* Capture the click from a message. */
        _ltk.Click.Submit();
    }	catch (er)	{
		/* An error has occurred, yet to determine if we want to do anything here. */
    }
}));
