/* globals google */
'use strict';
var $movadoStoreLocator = require('movado/storeLocator/storeLocator');

/**
 * appends params to a url
 * @param {string} url - Original url
 * @param {Object} params - Parameters to append
 * @returns {string} result url with appended parameters
 */


function appendToUrl(url, params) {
    var newUrl = url;
    newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(function (key) {
        return key + '=' + encodeURIComponent(params[key]);
    }).join('&');

    return newUrl;
}

function showStoreDialog(markers, e) {
    if ($(e.target).is('a') || !$('.map-canvas').is(':visible')) {
        return;
    }
    var marker = markers[$(e.currentTarget).data('itemindex')];
    google.maps.event.trigger(marker, 'click');
}

/* handling store click and enter */
function bindStoreMarker(markers) {
    $('body').on('click keydown', '.card-body.store-marker .store-card-tile', function (e) {
        if (e.type === 'click' || e.keyCode && e.keyCode === 13) {
            showStoreDialog(markers, e);
        }
    });
}

/**
 * Uses google maps api to render a map
 */
function maps() {
    var map;
    var infowindow = new google.maps.InfoWindow();

    // Init U.S. Map in the center of the viewport
    var latlng = new google.maps.LatLng(37.09024, -95.712891);
    var mapOptions = {
        scrollwheel: false,
        zoom: 4,
        center: latlng
    };
    var markers = [];

    map = new google.maps.Map($('.map-canvas')[0], mapOptions);
    var mapdiv = $('.map-canvas').attr('data-locations');

    mapdiv = JSON.parse(mapdiv);

    var bounds = new google.maps.LatLngBounds();

    // Customized google map marker icon with svg format
    var markerImg = {
        path: 'M13.5,30.1460153 L16.8554555,25.5 L20.0024287,25.5 C23.039087,25.5 25.5,' +
            '23.0388955 25.5,20.0024287 L25.5,5.99757128 C25.5,2.96091298 23.0388955,0.5 ' +
            '20.0024287,0.5 L5.99757128,0.5 C2.96091298,0.5 0.5,2.96110446 0.5,5.99757128 ' +
            'L0.5,20.0024287 C0.5,23.039087 2.96110446,25.5 5.99757128,25.5 L10.1445445,' +
            '25.5 L13.5,30.1460153 Z',
        fillColor: '#060506',
        fillOpacity: 1,
        scale: 1.1,
        strokeColor: 'white',
        strokeWeight: 1,
        anchor: new google.maps.Point(13, 30),
        labelOrigin: new google.maps.Point(12, 12)
    };

    Object.keys(mapdiv).forEach(function (key) {
        var item = mapdiv[key];
        var label = parseInt(key, 10) + 1;
        var storeLocation = new google.maps.LatLng(item.latitude, item.longitude);
        var marker = new google.maps.Marker({
            position: storeLocation,
            map: map,
            title: item.name,
            icon: markerImg,
            label: { text: label.toString(), color: 'white', fontSize: '1rem' }
        });

        marker.addListener('click', function () {
            infowindow.setOptions({
                content: item.infoWindowHtml
            });
            infowindow.open(map, marker);
        });

        // Create a minimum bound based on a set of storeLocations
        bounds.extend(marker.position);
        markers.push(marker);
    });
    // Fit the all the store marks in the center of a minimum bounds when any store has been found.
    if (mapdiv && mapdiv.length !== 0) {
        map.fitBounds(bounds);
    }


    bindStoreMarker(markers);
}


/**
 * Renders the results of the search and updates the map
 * @param {Object} data - Response from the server
 */
function updateStoresResults(data) {
    var $resultsDiv = $('.results');
    var $mapDiv = $('.map-canvas');
    //Custom Start: Checking the store locator page stage and updating the logic of conditions
    var $findPage = data.findPage == undefined ? false : data.findPage;
    //Custom End
    if (data.hasOwnProperty('success') && data.success == false) {
        $('.store-locator-no-results').hide();
        $('.store-locator-recaptcha-error').removeClass('d-none');
        $('.store-locator-recaptcha-error').text(data.errorMessage);
    } else {
        $('.store-locator-recaptcha-error').addClass('d-none');
        $('.store-locator-recaptcha-error').text('');

        var $hasResults = data.stores.length > 0;
        if (!$hasResults && $findPage === false) {
            $('.store-locator-no-results').show();
        } else {
            $('.store-locator-no-results').hide();
        }
    }
    $resultsDiv.empty()
        .data('has-results', $hasResults)
        .data('radius', data.radius)
        .data('search-key', data.searchKey);

    $mapDiv.attr('data-locations', data.locations);

    if ($mapDiv.data('has-google-api')) {
        maps();
    } else {
        $('.store-locator-no-apiKey').show();
    }

    if (data.storesResultsHtml) {
        $resultsDiv.append(data.storesResultsHtml);
        //Custom Start: Adding the logic to change background color of first store box
        $('.stores-list .store-marker').first().addClass('store-marker-black-background');
        //Custom End
    }
}

/**
 * Search for stores with new zip code
 * @param {HTMLElement} element - the target html element
 * @returns {boolean} false to prevent default event
 */
function search(element) {
    var dialog = element.closest('.in-store-inventory-dialog');
    var spinner = dialog.length ? dialog.spinner() : $.spinner();
    spinner.start();
    var $form = element.closest('.store-locator');
    var radius = $('.results').data('radius');
    var url = $form.attr('action');
    var countryCode = $form.find('[name="countryCode"]').val();
    var address = $form.find('[name="address"]').val();
    var isForm = true;
    var googleRecaptchaToken = $('.g-recaptcha-token').val();


    var urlParams = {
        radius: radius,
        countryCode: countryCode,
        address: address,
        isForm: isForm,
        googleRecaptchaToken: googleRecaptchaToken
    };

    var payload = $form.is('form') ? $form.serialize() : {
        countryCode: $form.find('[name="countryCode"]').val(),
        address: $form.find('[name="address"]').val()
    };

    url = appendToUrl(url, urlParams);

    $.ajax({
        url: url,
        type: $form.attr('method'),
        data: payload,
        dataType: 'json',
        success: function (data) {
            spinner.stop();
            updateStoresResults(data);
            $('.select-store').prop('disabled', true);
        },
        error: function () {
            spinner.stop();
        }
    });
    return false;
}

module.exports = {

    //Custom Start: Overriding the initialization method of store locator.
    init: function () {
        if ($('.map-canvas').data('has-google-api')) {
            maps();
        } else {
            $('.store-locator-no-apiKey').show();
        }
        if ($('.results').data('has-results')) {
            //Custom Start: Adding the logic to change background color of first store box
            $('.stores-list .store-marker').first().addClass('store-marker-black-background');
            //Custom End
        }
    },
    //Custom End

    //Custom Start: Overriding the submit and click events of store locator
    search: function () {
        $('body').off('submit', '.store-locator-container form.store-locator').on('submit', '.store-locator-container form.store-locator', function (e) {
            e.preventDefault();
            search($(this));
        });

        $('body').off('click', '.store-locator-container .btn-storelocator-search[type="button"]').on('click', '.store-locator-container .btn-storelocator-search[type="button"]', function (e) {
            e.preventDefault();
            search($(this));
        });
    },
    //Custom End

  //Custom Start: Overriding the change radius event of store locator
    changeRadius: function () {
        $('body').off('change', '.store-locator-container .radius').on('change', '.store-locator-container .radius', function () {
            var radius = $(this).val();
            var searchKeys = $('.results').data('search-key');
            var url = $('.radius').data('action-url');
            var urlParams = {};
            var isForm = false;
            var googleRecaptchaToken = $('.g-recaptcha-token').val();

            if (searchKeys.postalCode) {
                urlParams = {
                    radius: radius,
                    postalCode: searchKeys.postalCode,
                    isForm: isForm,
                    googleRecaptchaToken: googleRecaptchaToken
                };
            } else if (searchKeys.lat && searchKeys.long) {
                urlParams = {
                    radius: radius,
                    lat: searchKeys.lat,
                    long: searchKeys.long,
                    isForm: isForm,
                    googleRecaptchaToken: googleRecaptchaToken
                };
            }

            url = appendToUrl(url, urlParams);
            var dialog = $(this).closest('.in-store-inventory-dialog');
            var spinner = dialog.length ? dialog.spinner() : $.spinner();
            spinner.start();
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    spinner.stop();
                    updateStoresResults(data);
                    $('.select-store').prop('disabled', true);
                },
                error: function () {
                    spinner.stop();
                }
            });
        });
    },
    //Custom End

    //Custom Start: Adding the custom method to change background color of selected store box.
    changeBackground: function () {
        $('body').on('click','.stores-list .store-marker', function (e) {
            $('.store-marker').removeClass('store-marker-black-background');
            $(this).addClass('store-marker-black-background');
        });
    },
    //Custom End

    detectLocation: $movadoStoreLocator.detectLocation(),
    selectStore: $movadoStoreLocator.selectStore(),
    updateSelectStoreButton: $movadoStoreLocator.updateSelectStoreButton()
};
