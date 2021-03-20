var _=require("lodash");
var _lang_code=null;
var _translations=null;

export function set_translations(val) {
    _translations=val;
}

export function set_active_lang(code) {
    _lang_code=code;
}

export function get_active_lang() {
    return _lang_code||"en_US";
}

export function translate(s) {
    if (!_.isString(s)) return s
    s=s.trim();
    var trans={};
    if (_translations) {
        trans=_translations[_lang_code||"en_US"]||{};
    }
    var val=trans[s];
    if (!val) {
        //if (s.length > 2 && (/^[\x00-\x7F]*$/.test(s))) {
            //console.log("require translate:",s);
        //}
        val=s;
    }
    return val;
}
