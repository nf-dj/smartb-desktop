var moment=require("moment");
var i18n=require("./i18n");

export function get_cookie(name) {
    return localStorage.getItem(name);
}

export function set_cookie(name,val) {
    localStorage.setItem(name,""+val);
}

export function clear_cookie(name) {
    localStorage.removeItem(name)
}

function remove_extra_zeros(s,min_digits) {
    var i=s.indexOf(".");
    if (i==-1) return s;
    var last=i+min_digits;
    i=last+1;
    while (i<s.length) {
        if (s[i]!="0") last=i;
        i++;
    }
    return s.slice(0,last+1);
}

export function fmt_money_pos(n, c, d, t) {
        var c = isNaN(c = Math.abs(c)) ? 2 : c, d = d == undefined ? "." : d, t = t == undefined ? "," : t, s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
            var res=s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
                return remove_extra_zeros(res,2);
}

export function fmt_money(n, c, d, t) {
        if (n==null) return "";
        if (n<0) return "("+fmt_money_pos(-n,c,d,t)+")";
            return fmt_money_pos(n,c,d,t);
}

export function fmt_hours(hours) {
    if (hours==null) return "";
    var sec_num=hours*3600;
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    return hours+' h '+minutes+' m';
}

export function fmt_date(val,fmt) {
    if (!val) return "";
    var locale = "en";
    if (i18n.get_active_lang() === "th_TH") {
        locale = "th";
    }
    return moment(val).locale(locale).format(fmt);
}

export function make_qs(obj) {
  var str = [];
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}
