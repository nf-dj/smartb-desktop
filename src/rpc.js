var utils=require("./utils");

var _rpc_base_url;
var _database;
var _user_id;
var _token;
var _company_id;

export function set_base_url(base_url) {
    console.log("rpc.set_base_url",base_url);
    _rpc_base_url=base_url;
}

export function clear_base_url() { //Max 3rd Mac 2021
    console.log("rpc.clear_base_url",_rpc_base_url);
    _rpc_base_url=null;
}

export function set_database(dbname) {
    console.log("rpc.set_database",dbname);
    _database=dbname;
}

export function clear_database() { //Max 3rd Mac 2021
    console.log("rpc.clear_database",_database);
    _database=null;
}

export function set_user(user_id,token) {
    _user_id=user_id;
    _token=token;
}

export function set_company(company_id,token) {
    _company_id=company_id;
}

export function execute(model,method,args,opts) {
    console.log("rpc.execute",model,method,args,opts);
    if (!_rpc_base_url) throw "RPC base URL is undefined";
    var params=[model,method];
    params.push(args);
    params.push(opts||{});
    var cookies={};
    cookies.user_id=utils.get_cookie("user_id");
    cookies.token=utils.get_cookie("token");
    cookies.company_id=utils.get_cookie("company_id");
    params.push(cookies);
    var headers={
        "Accept": "application/json",
        "Content-Type": "application/json",
    };
    if (!_database) throw "Missing database";
    if (_database) headers["X-Database"]=_database;
    return fetch(_rpc_base_url+"/json_rpc",{
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            id: (new Date()).getTime(),
            method: "execute",
            params: params
        }),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.error) {
            console.log("rpc.execute error",model,method);
            var msg = data.error.message;
            // trim ? at the front
            if (msg.startsWith("?")) {
                msg = msg.substring(1);
            }
            //throw "RPC Error: "+msg;
            throw msg;
        }
        //console.log("rpc.execute done",model,method,data.result);
        console.log("rpc.execute done",model,method);
        return data.result;
    });
}

export function upload_file(file,result_cb,progress_cb) {
    console.log("rpc.upload_file",file);
    if (!_rpc_base_url) throw "RPC base url is undefined";
    var data=new FormData();
    data.append("file",file);
    var headers={};
    if (_database) headers["X-Database"]=_database;
    fetch(_rpc_base_url+"/upload?filename="+encodeURIComponent(file.name),{
        method: "POST",
        headers: headers,
        body: data,
    })
    .then((response) => response.text())
    .then((responseText) => {
        if (result_cb) result_cb(null,responseText);
    })
    .catch((err) => {
        alert("upload error: "+err);
        if (result_cb) result_cb(err,null);
    });
    //.done();
}

export function get_file_uri(filename) {
    if (!filename) return null;
    if (filename.startsWith("http://")||filename.startsWith("https://")) {
        var url=filename;
    } else if (filename[0]=="/") {
        var url=_rpc_base_url+"/static"+filename;
    } else {
        /*if (true) {
            var res=filename.split(",");
            if (res.length == 2) {
                filename=res[0] + "-resize-512," + res[1];
            }
        }*/
        var url=_rpc_base_url+"/static/db/"+_database+"/files/"+filename;
    }
    return url;
}

export function get_file_name(val) {
    if (!val) return "";
    if (val[0]=="/") {
        var res=val.split("/");
        return res[res.length-1];
    }
    if (val.startsWith("http://") || val.startsWith("https://")) {
        var res=val.split("/");
        var val=res[res.length-1];
    }
    console.log("val",val);
    var re=/^(.*),(.*?)(\..*)?$/;
    var m=re.exec(val);
    if (!m) return val;
    var s;
    if (m) {
        s=m[1];
        if (m[3]) s+=m[3];
    } else {
        s=val;
    }
    return s;
}
