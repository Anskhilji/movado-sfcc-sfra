! function(e) {
    e.fn.customSelect = function(t) {
        e(this).each(function() {
            function o() {
                s = [], e.each(r, function(t, o) {
                    var n = e(o).text().trim();
                    s.push(n)
                })
            }

            function n() {
                v.removeClass(f), b.slideUp(d.transition, function() {
                    "function" == typeof d.hideCallback && d.hideCallback.call(v[0])
                }), e(window).off("click touchstart", i), k.off("click"), a(), d.keyboard && (w.blur(), e(window).off("keydown", c)), d.autocomplete && (w.show(), m.val(""), x.scrollTop(0))
            }

            function a() {
                k.one("click", function() {
                    var t = "ontouchstart" in document.documentElement ? "touchstart" : "click";
                    v.addClass(f), b.slideDown(d.transition, function() {
                        "function" == typeof d.showCallback && d.showCallback.call(v[0])
                    }), e(window).on(t, i), k.one("click", function() {
                        n()
                    }), d.keyboard && (d.index = -1, e(window).on("keydown", c))
                })
            }

            function i(t) {
                var o = e(t.target);
                o.parents().is(v) || o.is(v) || n()
            }

            function c(t) {
                var o = h + ":visible";
                switch (t.keyCode) {
                    case 40:
                        t.preventDefault(), 0 !== b.find(o).eq(d.index + 1).length ? d.index += 1 : d.index = 0, b.find(o).eq(d.index).focus();
                        break;
                    case 38:
                        t.preventDefault(), 0 !== b.find(o).eq(d.index - 1).length && d.index - 1 >= 0 ? d.index -= 1 : d.index = b.find(o).length - 1, b.find(o).eq(d.index).focus();
                        break;
                    case 13:
                    case 32:
                        m && m.is(":focus") || (t.preventDefault(), e(h + ":focus").trigger("click"), l.trigger("change"), k.focus());
                        break;
                    case 27:
                        t.preventDefault(), n(), k.focus()
                }
            }
            var l = e(this),
                s = [],
                d = {
                    autocomplete: !1,
                    block: "custom-select",
                    hideCallback: !1,
                    includeValue: "ok",
                    keyboard: !1,
                    modifier: !1,
                    placeholder: !1,
                    showCallback: !1,
                    transition: 100
                };
            "object" == typeof t && e.extend(d, t), l.hide().after('<div class="' + d.block + '"><button class="selected-value ' + d.block + "__option " + d.block + '__option--value"></button><div class="' + d.block + '__dropdown"></div></div>');
            var r = l.find("option"),
                u = "." + d.block,
                f = d.block + "--active",
                p = '<button class="' + d.block + '__option"></button>',
                h = u + "__option",
                v = l.next(u),
                k = v.find(u + "__option--value"),
                b = v.find(u + "__dropdown");
            if (d.modifier && v.addClass(d.modifier), o(), b.html("").hide(), d.autocomplete) {
                var m = e('<input class="' + d.block + '__input">');
                d.placeholder && m.attr("placeholder", d.placeholder), b.append(m)
            }
            e.each(s, function(t, o) {
                var n = r.eq(t).attr("class"),
                    a = e(p).text(o).addClass(n);
                o === l.find(":selected").text().trim() ? (k.text(o).addClass(n).data("class", n), d.includeValue && b.append(a)) : b.append(a)
            }), a();
            var w = b.find(h);
            if (d.autocomplete) {
                w.wrapAll('<div class="' + d.block + '__option-wrap"></div>');
                var x = b.find(u + "__option-wrap")
            }
            w.on("click", function(t) {
                var a = e(this).text().trim();
                k.text(a).removeClass(k.data("class")), r.prop("selected", !1), e.each(s, function(t, o) {
                    d.includeValue || o !== a || s.splice(t, 1), e.each(r, function(t, o) {
                        var n = e(o);
                        if (n.text().trim() === a) {
                            var i = n.attr("class");
                            n.prop("selected", !0), k.addClass(i).data("class", i)
                        }
                    })
                }), n(), d.includeValue || e.each(w, function(t, o) {
                    var n = e(o);
                    n.text(s[t]), n.attr("class", d.block + "__option"), e.each(r, function() {
                        var o = e(this);
                        o.text().trim() === s[t] && n.addClass(o.attr("class"))
                    })
                }), o(), void 0 !== t.originalEvent && l.trigger("change")
            }), d.autocomplete && (m.on("focus", function() {
                d.index = -1, x.scrollTop(0)
            }), m.on("keyup", function() {
                var t = m.val().trim();
                t.length ? setTimeout(function() {
                    t === m.val().trim() && e.each(w, function(o, n) {
                        var a = e(n),
                            i = -1 !== a.text().trim().toLowerCase().indexOf(t.toLowerCase());
                        a.toggle(i)
                    })
                }, 300) : w.show()
            }))
        })
    }
}(jQuery);