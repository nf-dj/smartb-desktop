var _=require("underscore");
var moment=require("moment-timezone");
var numeral=require("numeral");

var get_file_name = function get_file_name(val) {
    console.log("get_file_name", val);
    if (!val) return "";
    if (val[0] == "/") {
        var res = val.split("/");
        return res[res.length - 1];
    }
    if (val.startsWith("http://") || val.startsWith("https://")) {
        var res = val.split("/");
        var val = decodeURIComponent(res[res.length - 1]);
    }
    console.log("val", val);
    var re = /^(.*),(.*?)(\..*)?$/;
    var m = re.exec(val);
    if (!m) return val;
    var s;
    if (m) {
        s = m[1];
        if (m[3]) s += m[3];
    } else {
        s = val;
    }
    return s;
};

module.exports.get_file_name = get_file_name;


var get_cookies = function get_cookies() {
    var cookies = {};
    var oCrumbles = document.cookie.split(';');
    for (var i = 0; i < oCrumbles.length; i++) {
        var oPair = oCrumbles[i].split('=');
        var sKey = decodeURIComponent(oPair[0].trim().toLowerCase());
        var sValue = oPair.length > 1 ? oPair[1] : '';
        cookies[sKey] = decodeURIComponent(sValue);
    }
    return cookies;
};
module.exports.get_cookies = get_cookies;

module.exports.get_cookie = function (name) {
    var cookies = get_cookies();
    return cookies[name];
};

function set_cookie(sName, sValue) {
    var oDate = new Date();
    oDate.setYear(oDate.getFullYear() + 1);
    var sCookie = encodeURIComponent(sName) + '=' + encodeURIComponent(sValue) + ';expires=' + oDate.toGMTString() + ';path=/';
    document.cookie = sCookie;
}

module.exports.set_cookie = set_cookie;

module.exports.clear_cookie = function (name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

function remove_extra_zeros(s, min_digits) {
    var i = s.indexOf(".");
    if (i == -1) return s;
    var last = i + min_digits;
    i = last + 1;
    while (i < s.length) {
        if (s[i] != "0") last = i;
        i++;
    }
    return s.slice(0, last + 1);
}

function fmt_money_pos(n, c, d, t) {
    var c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    var res = s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    return remove_extra_zeros(res, 2);
}

function fmt_money(n, c, d, t) {
    if (n < 0) return "(" + fmt_money_pos(-n, c, d, t) + ")";
    return fmt_money_pos(n, c, d, t);
}

module.exports.fmt_money = fmt_money;
var fmt_qty = fmt_money; // XXX
module.exports.fmt_qty = fmt_qty; // XXX

function fmt_num(val, fmt) {
    if (val == null) return "";
    var s = numeral(val).format(fmt);
    return s;
}
module.exports.fmt_num = fmt_num;

function fmt_date(val, fmt) {
    if (!val) return "";
    if (!fmt) {
        fmt = ui_params.get_date_format();
    }
    var d = moment(val);
    if (ui_params.use_buddhist_date()) {
        d = d.add("years", 543);
    }
    return d.format(fmt);
}
module.exports.fmt_date = fmt_date;

function fmt_datetime(val,opts) {
    if (!opts) opts={};
    if (!val) return "";
    var fmt = ui_params.get_date_format() + " HH:mm:ss";
    var tz = ui_params.get_timezone();
    if (tz && !opts.no_conv_tz) {
        var d = moment.tz(val,tz).local();
    } else {
        var d = moment(val);
    }
    if (ui_params.use_buddhist_date()) {
        d = d.add("years", 543);
    }
    return d.format(fmt);
}
module.exports.fmt_datetime = fmt_datetime;

function fmt_hours(hours) {
    if (!hours) return "0 h";
    var sec_num = Math.ceil(hours * 3600);
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - hours * 3600) / 60);
    return hours + ' h ' + minutes + ' m';
}
module.exports.fmt_hours = fmt_hours;
