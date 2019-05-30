'use strict';

var $compareBar = $('.compare-bar-wrapper');
var MAX_SLOTS = 3;
var productsForComparison = [];
var compareButtonText = $('button.compare').text();

var lastKnownUrl = location.href;


/**
 * @typedef ProductComparisonList
 * @type Object
 * @property {string} pid - ID for product to compare
 * @property {string} imgSrc - Image URL for selected product
 */

/**
 * Compiles the HTML for a single slot
 *
 * @param {ProductComparisonList} product - Selected product to compare
 * @param {number} idx - Slot number (zero-based)
 * @return {string} - HTML for a single slot
 */
function compileSlot(product, idx) {
    var pid = product.pid;
    var name = 'pid' + idx;
    var url = $('[data-compare-url]').data('compare-url');

    return '' +
    '<div class="selected-product">' +
      '<div class="slot" data-pid="' + pid + '">' +
        '<img src="' + product.imgSrc + '" />' +
        '<span class="remove-product close-icon-white" data-compare-url="' + url + '"></span>' +
      '</div>' +
      '<input type="hidden" name="' + name + '" value="' + pid + '" />' +
    '</div>\n';
}

/**
 * Draw and render the Compare Bar product slots
 *
 * @param {ProductComparisonList []} productsToCompare - List of ID's of the products to compare
 */
function redrawCompareSlots(productsToCompare) {
    var html = productsToCompare.map(function (product, idx) {
        return compileSlot(product, idx);
    }).join('');

  // Render empty slots
    if (productsToCompare.length < MAX_SLOTS) {
        var numAvailableSlots = MAX_SLOTS - productsToCompare.length;

        for (var i = 0; i < numAvailableSlots; i++) {
            if (i === 0 && productsToCompare.length < 2) {
                html += '<div class="selected-product"><div class="slot">' +
          '<div class="min-products-msg">' + $('.compare-bar').data('min-products-msg') +
          '</div></div></div>';
            } else {
                html += '<div class="selected-product"><div class="slot"></div></div>';
            }
        }
    }

    $('.compare-bar .product-slots').empty().append(html);
}

/**
 * Enables/disables the Compare button, depending on whether at least two products have been
 * selected for comparison
 *
 * @param {number} numProducts - Number of products selected for comparison
 */
function setCompareButton(numProducts) {
    if (numProducts > 0) {
        $('button.compare').text(compareButtonText + '(' + numProducts + ')');
    } else {
        $('button.compare').text(compareButtonText);
    }
    if (numProducts < 2) {
        $('button.compare').attr('disabled', true);
    } else {
        $('button.compare').removeAttr('disabled');
    }
}

/**
 * Returns a copy of a list of products to compare
 *
 * @param {ProductComparisonList []} productsToCompare - List of ID's of the products to compare
 * @return {ProductComparisonList []} List of ID's of the products to compare
 */
function copyProducts(productsToCompare) {
    return productsToCompare.map(function (product) {
        var proxy = {};

        Object.keys(product).forEach(function (key) {
            proxy[key] = product[key];
        });

        return proxy;
    });
}

/**
 * Handles the selection of a product for comparison
 *
 * @param {ProductComparisonList []} productsToCompare - List of ID's of the products to compare
 * @return {ProductComparisonList []} List of ID's of the products to compare
 */
function selectProduct(productsToCompare) {
    if (productsToCompare.length === MAX_SLOTS) {
        $('input[type=checkbox]:not(:checked)').attr('disabled', true);
    }

    redrawCompareSlots(productsToCompare);
    setCompareButton(productsToCompare.length);
    $compareBar.show();

    return productsToCompare;
}


/**
 * Handles the deselection of a product
 *
 * @param {ProductComparisonList []} productsToCompare - List of ID's of the products to compare
 * @param {string} pid - ID for product to compare
 * @return {ProductComparisonList []} List of ID's of the products to compare
 */
function deselectProduct(productsToCompare, pid) {
    if (productsToCompare.length === 0) {
        $compareBar.hide();
    }

    $('input#' + pid).prop('checked', false);
    $('input[type=checkbox]:not(:checked)').removeAttr('disabled');
    $('[data-pid="' + pid + '"]').closest('.selected-product').remove();
    setCompareButton(productsToCompare.length);

    return productsToCompare;
}

/**
 * Clears the Compare Bar and hides it
 * @return {undefined}
 */
function clearCompareBar() {
	// get the array for product comparison through ajax send action value as 'clearall'
	// var url = '/on/demandware.store/Sites-MovadoUS-Site/default/Compare-ProductListFormation';
    var url = $('[data-compare-url]').data('compare-url');
    $.ajax({
		  method: 'POST',
		  url: url,
		  data: {
				  compareAction: 'clearall'
			 	},
		  success: function (data) {
			  productsForComparison = data.viewData.productsToCompare;
		  }
    });
    productsForComparison.forEach(function (product) {
        $(this).trigger('compare:deselected', {
            pid: product.pid
        });
    });

    productsForComparison = [];
    $('.compare input').prop('checked', false);
    $('.compare input[type=checkbox]:not(:checked)').removeAttr('disabled');
    $compareBar.hide();
}

/**
 * Update form action url to not have query string
 * @returns {undefined}
 */
function updateSubmitUrl() {
    var form = $('.compare-products-form');
    var targetUrl = form.attr('action');
    var urlParts = targetUrl.split('?');
    if (urlParts[1]) {
        urlParts[1].split('&').forEach(function (keyValue) {
            var splittedValues = keyValue.split('=');
            var key = decodeURIComponent(splittedValues[0]);
            var value = decodeURIComponent(splittedValues[1]);
            if (key && value) {
                if (form.find('[name="' + key + '"]').length === 0) {
                    form.append('<input type="hidden" name="' + key + '" value="' + value + '" />');
                }
            }
        });
        form.attr('action', urlParts[0]);
    }
}

module.exports = {
  /**
   * Handles Compare checkbox click
   */
    handleCompareClick: function () {
        $('div.page').on('click', '.compare input[type=checkbox]', function () {
            var pid = $(this).attr('id');
            var checked = $(this).is(':checked');
            var imgSrc = $(this).closest('.product-tile')
        .find('.tile-image')
        .prop('src');

            if (checked) {
    	// get the array for product comparison through ajax send action value as 'selected', pid, imgSrc
    	var url = $(this).data('compare-url');
    	$.ajax({
			  method: 'POST',
			  url: url,
			  data: {
					  pid: pid,
					  imgSrc: imgSrc,
					  compareAction: 'selected'
				 	},
			  success: function (data) {
				  productsForComparison = selectProduct(data.viewData.productsToCompare);
			  }
    });

                $(this).trigger('compare:selected', {
                    pid: pid
                });
            } else {
    	// get the array for product comparison through ajax send action value as 'deselected', pid
      	var url = $(this).data('compare-url');
      	$.ajax({
  			  method: 'POST',
  			  url: url,
  			  data: {
  					  pid: pid,
  					  compareAction: 'deselected'
  				 	},
  			  success: function (data) {
  				 productsForComparison = deselectProduct(data.viewData.productsToCompare, pid);
  			  }
  		});
                $(this).trigger('compare:deselected', {
                    pid: pid
                });
            }
        });
    },

  /**
   * Handles the Clear All link
   */
    handleClearAll: function () {
        $('.compare-bar .clear-all').on('click', function (e) {
            e.preventDefault();
            clearCompareBar();
        });
    },

  /**
   * Handles deselection of a product on the Compare Bar
   */
    deselectProductOnCompareBar: function () {
        $('.compare-bar').on('click', '.remove-product', function () {
            var pid = $(this).closest('.slot').data('pid').toString();
	  // get the array for product comparison through ajax send action value as 'deselected', pid
            var url = $(this).data('compare-url');
    	$.ajax({
			  method: 'POST',
			  url: url,
			  data: {
					  pid: pid,
					  compareAction: 'deselected'
				 	},
			  success: function (data) {
				  productsForComparison = deselectProduct(data.viewData.productsToCompare, pid);
			  }
    });
            $(this).trigger('compare:deselected', {
                pid: pid
            });
        });
    },

  /**
   * Selects products for comparison based on the checked status of the Compare checkboxes in
   * each product tile.  Used when user goes back from the Compare Products page.
   */
    selectCheckedProducts: function () {
	  $('body').ready(function () {
	  // ajax for product comparison list
		  var url = $('[data-compare-url]').data('compare-url');
		  if (url) {
	    	$.ajax({
				  method: 'POST',
				  url: url,
				  success: function (data) {
					  productsForComparison = data.viewData.productsToCompare;

      if (productsForComparison.length > 0) {
						  productsForComparison.forEach(function (id) {
						      if ($('input#' + id.pid).length) {
						    	  $('input#' + id.pid)
						    	  	.prop('checked', 'checked')
						    	  	.trigger('compare:selected', {
							          pid: id.pid
							        });
						      }
						    });
						  productsForComparison = selectProduct(productsForComparison);
					  }
				  }
    });
		 }
  });
    },

  /**
   * Sets the "backUrl" property to the last attribute selected URL to ensure that when the user
   * goes back from the Compare Products page, the previously selected attributes are still
   * selected and applied to the previous search.
   */
    setBackUrl: function () {
        $('.search-results').on('click', '.refinements a', function () {
            $('input[name="backUrl"]').val($(this).prop('href'));
        });
    },

  /**
   * Sets the history.pushState for history.back() to work from the Compare Products page.
   */
    setPushState: function () {
        $('.compare-products-form').on('submit', function () {
            updateSubmitUrl();
            var selectedProducts = $('.compare input:checked').map(function () {
                return this.id;
            }).get().join(',');
            history.pushState({}, document.title, lastKnownUrl + '#' + selectedProducts);
            location.hash = selectedProducts;

            $(this).find('input[name="cgid"]').attr('value', $('input.category-id').val());
        });
    },
    listenToFilterChange: function () {
        $('body').on('search:filter', function (e, data) {
            lastKnownUrl = data.currentTarget.href;
        });
    }
};
