/* eslint-disable no-useless-concat */
/* eslint-disable no-continue */
/* eslint-disable block-scoped-var */
/* eslint-disable consistent-return */
/* eslint-disable no-loop-func */
(function (d) {
    if (document.addEventListener) document.addEventListener('ltkAsyncListener', d);
    else {
        e = document.documentElement;
        e.ltkAsyncProperty = 0;
        e.attachEvent('onpropertychange', function (e) {
            if (e.propertyName === 'ltkAsyncProperty') { d(); }
        });
    }
}(function () {
    var scriptVars = document.querySelector('script[src*="ltkSubPoints.js"]');
    var formCodes = scriptVars.getAttribute('ltk-data');

    if (typeof formCodes === 'undefined') {
        formCodes = '';
    }

    formCodes = formCodes.substring(1, formCodes.length - 1);
    formCodes = formCodes.split(',');

    var names = [];
    for (var y = 0; y < formCodes.length; y++) {
        formCode = formCodes[y].toString().trim();

        // _ltk_util.consoleLog('Form code: ' + formCode);
        jQuery('form').each(function () {
            if (this.name === formCode || this.id === formCode) {
                // Now try to get all the elements and build ltkSignup
                _ltk_util.consoleLog("We have a form that's been setup");
                var inputs = getInputElements(formCode);
                var emailField = findEmail(inputs);
                var button = findButton(inputs);
                _ltk_util.consoleLog(emailField);
                _ltk.Signup.New(formCode, emailField, _ltk.Signup.TYPE.DEFAULT, "form[id = '" + formCode + "'], form[name = '" + formCode + "'] " + button);
                for (var i = 0; i < inputs.length; i++) {
                    if (inputs[i].type === 'email' || inputs[i].type === 'Submit') { continue; } else
                    if (inputs[i].type === 'checkbox') { _ltk.Signup.SetOptIn(formCode, "input[id='" + inputs[i].nameorid + "'], input[name='" + inputs[i].nameorid + "']"); } else
                            if (inputs[i].type === 'text') { _ltk.Signup.SetFieldWithKey(formCode, "input[id='" + inputs[i].nameorid + "'], input[name='" + inputs[i].nameorid + "']", inputs[i].nameorid); }
                }
            }
        });
    }
}));

/**
 * Helper methods
 * @param {*} inputs input
 * @returns {*} outputs
 */
function findEmail(inputs) {
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].type === 'email') { return inputs[i].nameorid; }
    }
}

/**
 * Helper methods
 * @param {*} inputs input
 * @returns {*} outputs
 */
function findButton(inputs) {
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].type === 'Submit') { return inputs[i].container; }
    }
}

/**
 * Helper methods
 * @param {*} formID input
 * @returns {*} outputs
 */
function getInputElements(formID) {
    var inputArray = [];
    var emailPattern = new RegExp('e[-_]?mail');
    var submitFound = false;
    jQuery('#' + formID + ", form[name='" + formID + "']").find(':input').each(function (key, element) {
        // Summary - grab all the elements and pass them back with some meta information about them to be used to build
        // the subpoint.  Skip certain fields like hidden/password,
        if (element.type !== 'hidden' && element.type !== 'password') {
            var inputData = {};
            inputData.nameorid = element.id !== '' ? element.id : element.name;

            if (element.type === 'email' || (element.type === 'text' && emailPattern.test(inputData.nameorid))) { inputData.type = 'email'; } else { inputData.type = element.type; }

            if (element.type === 'submit') {
                inputData.type = 'Submit';
                if (inputData.nameorid !== '') { inputData.container = 'button[id="' + inputData.nameorid + '"],button[name="' + inputData.nameorid + '"]'; } else {
                    inputData.container = 'button[type="submit"]';
                    inputData.nameorid = 'submit';
                }
                submitFound = true;
            }
            if (inputData !== undefined) { inputArray.push(inputData); }
        }
    });
    if (!submitFound) { // if there isn't an submit input type, look for a button'
        var btn = jQuery('#' + formID + ', ' + "form[name='" + formID + "']").find('button[type="submit"]');
        if (btn.length > 0) { // Found a submit button
            var submitElement = {};
            submitElement.type = 'Submit';
            submitElement.container = 'button[type="submit"]';
            submitElement.nameorid = 'Submit';
            inputArray.push(submitElement);
        }
    }
    return inputArray;
}
