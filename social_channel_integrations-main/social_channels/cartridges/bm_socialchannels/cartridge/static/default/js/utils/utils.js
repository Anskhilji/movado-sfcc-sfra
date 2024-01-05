/**
 * post data
 * @param {string} url - endpoint
 * @param {Object} data - response
 * @returns {Promise<any>} promise
 */
async function postData(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response.json();
}

// show spinner
const showSpinner = (spinner) => {
    spinner.style.display = 'block';
    spinner.classList.remove('slds-hide');
};

// hide spinner
const hideSpinner = (spinner) => {
    spinner.style.display = 'none';
    spinner.classList.add('slds-hide');
};

// show an element
const show = (element) => {
    element.style.display = 'block';
    element.classList.remove('slds-hide');
};

// hide an element
const hide = (element) => {
    element.style.display = 'none';
    element.classList.add('slds-hide');
};

// remove drop down options except the first option
const removeOptions = (element, removeAllOptions) => {
    var iterateIndex = removeAllOptions ? 0 : 1;
    for (var i = element.options.length - 1; i >= iterateIndex; i--) element.options.remove(i);
};

// add options to drop down list
const addOptions = (element, options) => {
    for (var i = 0; i < options.length; i++) {
        if (options[i].label != null && options[i].value != null) {
            var option = document.createElement('option');
            option.text = options[i].label;
            option.value = options[i].value;
            element.appendChild(option);
        }
    }
};

// common function to add options and show container section
const handleAddOptions = (container, selectElement, options) => {
    // add options to drop down list
    removeOptions(selectElement, true);
    addOptions(selectElement, options);
    // if there is only 1 valid option, select it
    if (selectElement.options.length === 2) {
        selectElement.selectedIndex = 1;
    }
    selectElement.dispatchEvent(new Event('change'));
    show(container);
};

// common function to remove options and hide container section
const handleRemoveOptions = (container, selectElement, hideContainer = true, selectedIndex = null) => {
    // remove options from drop down list
    selectElement.selectedIndex = -1;
    selectElement.dispatchEvent(new Event('change'));
    removeOptions(selectElement, false);
    if (hideContainer) {
        hide(container);
    }
    if (selectedIndex != null && selectElement.options.length > selectedIndex) {
        selectElement.selectedIndex = selectedIndex;
    }
};

const toggleRequiredState = (container, isRequired) => {
    const containerInputs = container.querySelectorAll('input, select');
    for (let i = 0; i < containerInputs.length; i++) {
        containerInputs[i].required = isRequired;
        if (!isRequired) {
            if (containerInputs[i].tagName === 'SELECT') {
                containerInputs[i].selectedIndex = -1;
            } else {
                containerInputs[i].value = '';
            }
        }
    }
};

export {
    addOptions,
    handleAddOptions,
    handleRemoveOptions,
    hide,
    hideSpinner,
    postData,
    removeOptions,
    show,
    showSpinner,
    toggleRequiredState
};
