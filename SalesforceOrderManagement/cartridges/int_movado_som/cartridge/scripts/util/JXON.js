'use strict';
/* eslint-disable */

function JXON() { };

JXON.toJS = function (doc) {
    var originalString;
    var obj;
    var result;

    if (!doc) return null;

    if (!(doc instanceof XML)) {
        originalString = doc.toString();
        doc = new XML(doc);
    }

    obj = getJXONTree(doc);
    result = {};

    if (doc.localName()) {
        result[doc.localName()] = obj;
        return result;
    } else {
        return originalString;
    }

    function getJXONTree(oXMLParent) {
        var vResult = {},
            nLength = 0,
            sCollectedTxt = "";

        if (oXMLParent.attributes().length()) {
            for each(var a in oXMLParent.attributes()) {
                vResult["@" + a.localName()] = parseText(a.valueOf().trim());
                nLength++;
            }
        }

        if (oXMLParent.children().length()) {
            for each(var node in oXMLParent.children()) {
                var nodeKind = node.nodeKind();
                if (nodeKind === "text") {
                    sCollectedTxt += node;
                } else if (nodeKind === "element") {
                    var sProp = node.localName();
                    vContent = getJXONTree(node);
                    if (vResult.hasOwnProperty(sProp)) {
                        if (vResult[sProp].constructor !== Array) {
                            vResult[sProp] = [vResult[sProp]];
                        }
                        vResult[sProp].push(vContent);
                    } else {
                        vResult[sProp] = vContent;
                        nLength++;
                    }
                }
            }
        }

        if (sCollectedTxt) {
            nLength > 0 ? vResult.keyValue = parseText(sCollectedTxt) : vResult = parseText(sCollectedTxt);
        }

        return vResult;
    }
}

JXON.toXMLString = function (obj) {
    return toXML(obj).toXMLString();
}

function toXML(oObjTree) {
    var oNewDoc, ns;

    for (var sName in oObjTree) {
        if (oObjTree[sName] instanceof Object) {
            if ("@xmlns" in oObjTree[sName]) {
                ns = (oObjTree[sName])["@xmlns"];
                oNewDoc = new XML("<" + sName + (ns ? " xmlns=\"" + ns + "\"" : "") + "/>");
                delete (oObjTree[sName])["@xmlns"];
                loadObjTree(oNewDoc, oObjTree[sName]);
                break;
            }
            oNewDoc = new XML("<" + sName + "/>");
            loadObjTree(oNewDoc, oObjTree[sName]);
            break;
        } else {
            oNewDoc = new XML("<" + sName + ">" + oObjTree[sName] + "</" + sName + ">");
            break;
        }
    }

    return oNewDoc;

    function loadObjTree(oParentEl, oParentObj) {
        if (!oParentObj) {
            return;
        }

        var vValue, oChild;

        if (oParentObj instanceof String || oParentObj instanceof Number || oParentObj instanceof Boolean) {
            oParentEl.appendChild(oParentObj.toString());
        } else if (oParentObj.constructor === Date) {
            oParentEl.appendChild(oParentObj.toGMTString());
        } else if (!(oParentObj instanceof Object)) {
            oParentEl.appendChild(oParentObj.toString());
        }

        for (var sName in oParentObj) {
            if (isFinite(sName)) {
                continue;
            }

            vValue = oParentObj[sName];
            if (sName === "keyValue") {
                if (vValue !== null) {
                    oParentEl.appendChild(vValue.constructor === Date ? vValue.toGMTString() : stripInvalidXMLCharacters(vValue));
                }
            } else if (sName.charAt(0) === "@") {
                oParentEl.@[sName.slice(1)] = stripInvalidXMLCharacters(vValue);
            } else if (vValue.constructor === Array) {
                for (var nItem = 0; nItem < vValue.length; nItem++) {
                    oChild = new XML("<" + sName + "/>");
                    if (vValue[nItem] instanceof Object) {
                        loadObjTree(oChild, vValue[nItem]);
                    } else {
                        oChild.appendChild(stripInvalidXMLCharacters(vValue[nItem].toString()));
                    }
                    oParentEl.appendChild(oChild);
                }
            } else {
                oChild = new XML("<" + sName + "/>");
                if (vValue instanceof Object) {
                    loadObjTree(oChild, vValue);
                } else if (vValue) {
                    oChild.appendChild(stripInvalidXMLCharacters(vValue.toString()));
                }
                oParentEl.appendChild(oChild);
            }
        }
    }
}

function parseText(sValue) {
    if (/^\s*$/.test(sValue)) {
        return null;
    }
    if (/^(?:true|false)$/i.test(sValue)) {
        return sValue.toLowerCase() === "true";
    }
    if (isFinite(sValue)) {
        return sValue.toString();  // parseFloat(sValue);   NOTE: Treat all doubles as string.  e.g., long tracking numbers
    }
    if (isFinite(Date.parse(sValue))) {
        return new Date(sValue);
    }
    return sValue;
}

//Strips out illegal characters per W3C spec http://www.w3.org/TR/xml/#charsets
function stripInvalidXMLCharacters(s) {
    if (!s) return "";
    let outString = "";
    for (var i = 0; i < s.length; i++) {
        let current = s.charCodeAt(i);
        if ((current == 0x9) ||
            (current == 0xA) ||
            (current == 0xD) ||
            ((current >= 0x20) && (current <= 0xD7FF)) ||
            ((current >= 0xE000) && (current <= 0xFFFD)) ||
            ((current >= 0x10000) && (current <= 0x10FFFF))) {
            outString += String.fromCharCode(current);
        };
    };
    return outString;
}

module.exports = JXON;
