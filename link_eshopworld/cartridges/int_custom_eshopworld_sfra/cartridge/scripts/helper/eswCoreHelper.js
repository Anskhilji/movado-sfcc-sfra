
var eswCoreHelper = module.superModule;
var getEswHelper = eswCoreHelper.getEswHelper;

getEswHelper.getLanguagesOptions = function() {
    let langObj = [],
    country = this.getAvailableCountry();
    var allowedMatchCountry = this.checkIsEswAllowedCountry(country);
    if (empty(allowedMatchCountry)) {
        let countryJson = this.getAllCountryFromCountryJson(country);
        if (!empty(countryJson)) {
            for (var langCode = 0; langCode < countryJson.languages.length; langCode++) {
                langObj.push({value: countryJson.languages[langCode], displayValue: countryJson.languages[langCode]});
            }
        } else {
            langObj = null;
        }
        return langObj;
    } else {
        return this.getAllowedLanguages();
    }
    return;
};

module.exports = {
        getEswHelper : getEswHelper
}