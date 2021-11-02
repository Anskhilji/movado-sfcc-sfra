'use strict';

var keyboardAccessibility = require('base/components/keyboardAccessibility');

var clearSelection = function (element) {
    $(element).closest('.dropdown').children('.dropdown-menu').children('.top-category')
    .detach();
    $(element).closest('.dropdown.show').children('.nav-link').attr('aria-expanded', 'false');
    $(element).closest('.dropdown.show').removeClass('show');
    $(element).closest('li').detach();
};

$(document).ready(function() {
    var visitAccessibility = true;
    if ($('#emailOptInPopUp').is(':visible') || $('.email-popup-container').is(':visible')) {
        visitAccessibility = false;
    }
    $(document).keydown(function(e) {
        if (e.keyCode == 9 && visitAccessibility == true) {
            e.preventDefault();
            $('.accessible-link').focus();
            visitAccessibility = false;
        }
    });
});

module.exports = function () {
    var isDesktop = function (element) {
        return $(element).parents('.menu-toggleable-left').css('position') !== 'fixed';
    };

    $('.navbar-toggleable-sm .close-button').click(function() {
        $('.accessible-link').css('z-index', 100001);
    });

    $('.header-banner .close').on('click', function () {
        $('.header-banner').addClass('hide'); 
    });

    keyboardAccessibility('.main-menu .nav-link, .main-menu .dropdown-link', {
        40: function (menuItem) { // down
            if (menuItem.hasClass('nav-item')) { // top level
                $('.navbar-nav .show').removeClass('show')
            .children('.dropdown-menu')
            .removeClass('show');
                menuItem.addClass('show').children('.dropdown-menu').addClass('show');
                $(this).attr('aria-expanded', 'true');
                menuItem.find('ul > li > a')
            .first()
            .focus();
            } else {
                menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                $(this).attr('aria-expanded', 'false');
                menuItem.next().children().first().focus();
            }
        },
        39: function (menuItem) { // right
            if (menuItem.hasClass('nav-item')) { // top level
                menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                $(this).attr('aria-expanded', 'false');
                menuItem.next().children().first().focus();
            } else if (menuItem.hasClass('dropdown')) {
                menuItem.addClass('show').children('.dropdown-menu').addClass('show');
                $(this).attr('aria-expanded', 'true');
                menuItem.find('ul > li > a')
            .first()
            .focus();
            }
        },
        38: function (menuItem) { // up
            if (menuItem.hasClass('nav-item')) { // top level
                menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                $(this).attr('aria-expanded', 'false');
            } else if (menuItem.prev().length === 0) {
                menuItem.parent().parent().removeClass('show')
            .children('.nav-link')
            .attr('aria-expanded', 'false');
                menuItem.parent().parent().children().first()
            .focus();
            } else {
                menuItem.prev().children().first().focus();
            }
        },
        37: function (menuItem) { // left
            if (menuItem.hasClass('nav-item')) { // top level
                menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                $(this).attr('aria-expanded', 'false');
                menuItem.prev().children().first().focus();
            } else {
                menuItem.closest('.show').removeClass('show')
            .closest('li.show').removeClass('show')
            .children()
            .first()
            .focus()
            .attr('aria-expanded', 'false');
            }
        },
        27: function (menuItem) { // escape
            var parentMenu = menuItem.hasClass('show') ?
          menuItem :
          menuItem.closest('li.show');
            parentMenu.children('.show').removeClass('show');
            parentMenu.removeClass('show').children('.nav-link')
          .attr('aria-expanded', 'false');
            parentMenu.children().first().focus();
        }
    },
    function () {
        return $(this).parent();
    }
  );

    $('.dropdown:not(.disabled) [data-toggle="dropdown"]')
    .on('click', function (e) {
        if (!isDesktop(this)) {
            $('.modal-background').show();
        // copy parent element into current UL
            var disableSubCategories = $(this).parent().children('.dropdown-menu').data('disablesubcategories');
            var borderClass = disableSubCategories == true ? 'border-0' : '';
            var li = $('<li class="dropdown-item top-category ' + borderClass + '" role="button"></li>');
            var link = $(this).clone().removeClass('dropdown-toggle')
          .removeAttr('data-toggle')
          .removeAttr('aria-expanded')
          .attr('aria-haspopup', 'false');
            li.append(link);
            var closeMenu = $('<li class="nav-menu"></li>');
            closeMenu.append($('.close-menu').first().clone());
            $(this).parent().children('.dropdown-menu')
          .prepend(li)
          .prepend(closeMenu);
        // copy navigation menu into view
            $(this).parent().addClass('show');
            $(this).attr('aria-expanded', 'true');
            e.preventDefault();
        }
    })
    .on('mouseenter', function () {
        if (isDesktop(this)) {
            var eventElement = this;
            $('.navbar-nav > li').each(function () {
                if (!$.contains(this, eventElement)) {
                    $(this).find('.show').each(function () {
                        clearSelection(this);
                    });
                    if ($(this).hasClass('show')) {
                        $(this).removeClass('show');
                        $(this).children('ul.dropdown-menu').removeClass('show');
                        $(this).children('.nav-link').attr('aria-expanded', 'false');
                    }
                }
            });
        // need to close all the dropdowns that are not direct parent of current dropdown
            $(this).parent().addClass('show');
            $(this).siblings('.dropdown-menu').addClass('show');
            $(this).attr('aria-expanded', 'true');
        }
    })
    .parent()
    .on('mouseleave', function () {
        if (isDesktop(this)) {
            $(this).removeClass('show');
            $(this).children('.dropdown-menu').removeClass('show');
            $(this).children('.nav-link').attr('aria-expanded', 'false');
        }
    });

    $('.navbar>.close-menu>.close-button').on('click', function (e) {
        e.preventDefault();
        $('.menu-toggleable-left').removeClass('in');
        $('.modal-background').hide();
    });

    $('.navbar-nav').on('click', '.back', function (e) {
        e.preventDefault();
        clearSelection(this);
    });

    $('.navbar-nav').on('click', '.close-button', function (e) {
        e.preventDefault();
        $('.navbar-nav').find('.top-category').detach();
        $('.navbar-nav').find('.nav-menu').detach();
        $('.navbar-nav').find('.show').removeClass('show');
        $('.menu-toggleable-left').removeClass('in');
        $('.modal-background').hide();
    });

    $('.navbar-toggler').click(function (e) {
        $('.lazy-load').removeClass('d-none');
        e.preventDefault();
        $('.main-menu').toggleClass('in');
        $('.modal-background').show();
        $('.accessible-link').css('z-index', 200);
    });

    keyboardAccessibility('.navbar-header .user', {
        40: function ($popover) { // down
            if ($popover.children('a').first().is(':focus')) {
                $popover.children('a').first().next().focus();
            } else {
                $popover.children('a').first().focus();
            }
        },
        38: function ($popover) { // up
            if ($popover.children('a').first().is(':focus')) {
                $(this).focus();
                $popover.removeClass('show');
            } else {
                $popover.children('a').first().focus();
            }
        },
        27: function ($popover) { // escape
            $(this).focus();
            $popover.removeClass('show');
        },
        9: function ($popover) { // tab
            $popover.removeClass('show');
        }
    },
    function () {
        var $popover = $('.user .popover');
        if (!($popover.hasClass('show'))) {
            $popover.addClass('show');
        }
        return $popover;
    }
  );

    $('body').on('click', function (evt) {
        var $popover = $('.navbar-header .user .popover');
        var $target = $(evt.target);

        if ($target.closest('.user').length) {
            if ($popover.hasClass('show') && !$target.closest('.popover').length) {
                $popover.removeClass('show');
            } else {
                $popover.addClass('show');
            }
        } else {
            $popover.removeClass('show');
        }
    });
};
