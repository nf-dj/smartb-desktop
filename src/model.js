const _=require("lodash");
import Dexie from "dexie";

var db=null;
var models={};

export function init_db(dbname) {
    db=new Dexie(dbname);
    db.version(1).stores({
        records: "++id,_model"
    });
}

export function get_db() {
    return db;
}

var models={};

export function get_model(name) {
    var m=models[name];
    if (!m) throw new Error("Invalid model: "+name);
    return m;
}

export class Model {
    constructor() {
        this._name=null;
        this._fields=null;
        this._name_field=null;
        this._defaults=null;
        this._key=null;
    }

    static register() {
        var m=new this();
        console.log("register",m._name);
        models[m._name]=m;
    }

    async default_get(fields) {
        console.log("default_get",this._name,fields);
        var vals={};
        var defaults=this._defaults||{};
        var promises=[];
        fields.forEach(n=>{
            if (!_.has(defaults,n)) return;
            var v=defaults[n];
            if (_.isFunction(v)) {
                promises.push((async ()=>{
                    var f=v;
                    v=await f();
                    vals[n]=v;
                })());
            } else {
                vals[n]=v;
            }
        });
        await Promise.all(promises);
        return vals;
    }

    async name_get(ids) {
        console.log("name_get",this._name,ids);
        var name_field=this._name_field||"name";
        var image_field=this._image_field;
        var fields=[name_field];
        var res=await this.read(ids,fields);
        return res.map(r=>{
            var vals={
                id: r.id,
                name: r[name_field],
            };
            if (image_field) {
                vals.image=r[image_field];
            }
            return vals;
        });
    }

    async name_search(cond) {
        console.log("name_search",this._name,cond);
        var ids=await this.search(cond);
        var res=await this.name_get(ids);
        return res;
    }

    async create(vals) {
        console.log("create",this._name,vals);
        var insert_vals={_model:this._name};
        Object.assign(insert_vals,vals);
        var other_fields=[];
        _.forEach(this._fields,(f,n)=>{
            if (_.has(vals,n)) return;
            other_fields.push(n);
        });
        var default_vals=await this.default_get(other_fields);
        Object.assign(insert_vals,default_vals);
        console.log("insert_vals",insert_vals);

        var id=await db.records.put(insert_vals);
        console.log("=> create id",id);
        return id;
    }

    async read(ids, fields, {load_m2o=true}={}) {
        console.log("read",this._name,ids,fields,"load_m2o",load_m2o);
        if (!fields) fields=[];
        var res=await db.records.where("id").anyOf(ids).toArray();
        if (fields) {
            res=_.map(res,o=>Object.assign(_.pick(o,fields),{id:o.id}));
        }
        console.log("read res",res);
        var id_data={};
        res.forEach(r=>{
            id_data[r.id]=r;
        });
        console.log("id_data",id_data);
        var data=ids.map(id=>id_data[id]).filter(r=>r!=null);
        console.log("data",data);

        var promises=[];
        fields.forEach(n=>{
            var f=this._fields[n];
            if (!f) throw new Error("Invalid field: "+this._name+"."+n);
            if (f.func) {
                promises.push((async ()=>{
                    var func=this[f.func];
                    func=func.bind(this);
                    var res=await func(ids);
                    data.forEach(r=>{
                        r[n]=res[r.id];
                    });
                })());
            }
        });
        await Promise.all(promises);

        fields.forEach(n=>{
            var f=this._fields[n];
            if (!f) throw new Error("Invalid field: "+this._name+"."+n);
			if (f.encrypt) {
                data.forEach(r=>{
                    var v=r[n];
                    if (v!=null) {
                        r[n]=decrypt(v);
                    }
                });
            }
        });

        promises=[];
        fields.forEach(n=>{
            var f=this._fields[n];
            if (f instanceof FieldMany2One && load_m2o) {
                promises.push((async ()=>{
                    var rids=[];
                    data.forEach(r=>{
                        var rid=r[n];
                        if (rid) rids.push(rid);
                    });
                    rids=_.uniq(rids);
                    if (!f.relation) throw new Error("Missing relation for field "+this._name+"."+n);
                    var mr=get_model(f.relation);
                    var res=await mr.name_get(rids);
                    var id_names={};
                    res.forEach(r=>id_names[r.id]=r.name);
                    data.forEach(r=>{
                        var rid=r[n];
                        var name=id_names[rid];
                        r[n]={
                            id: rid,
                            name: name,
                        };
                    });
                })());
            } else if (f instanceof FieldOne2Many) {
                promises.push((async ()=>{
                    if (!f.relation) throw new Error("Missing relation for field "+this._name+"."+n);
                    var mr=get_model(f.relation);
                    if (!f.relfield) throw new Error("Missing relfield for field "+this._name+"."+n);
                    var cond=[[f.relfield,"in",ids]];
                    var rids=await mr.search(cond);
                    var res=await mr.read(rids,[f.relfield],{load_m2o:false}); 
                    var vals={};
                    res.forEach(r=>{
                        var id=r[f.relfield];
                        if (!vals[id]) vals[id]=[];
                        vals[id].push(r.id);
                    });
                    data.forEach(r=>{
                        var rids=vals[r.id]||[];
                        r[n]=rids;
                    });
                })());
            }
        });
        await Promise.all(promises);
        console.log("=> read result",data);
        return data;
    }

    async read_one(id,fields) {
        var res=await this.read([id],fields);
        return res[0];
    }

    async read_one_path(id,fields) {
        var res=await this.read_path([id],fields);
        return res[0];
    }

    async write(ids, vals) {
        console.log("write",this._name,ids,vals);
        await db.records.where("id").anyOf(ids).modify(vals);
    }

    async delete(ids) {
        console.log("delete",this._name,ids);
        db.records.bulkDelete(ids);
    }

    _check_record(obj,cond) {
        var match=true;
        for (var clause of cond) {
            var name=clause[0];
            var op=clause[1];
            var val=clause[2];
            if (op=="=") {
                if (obj[name]!=val) {
                    match=false;
                    return;
                }
            } else if (op=="!=") {
                if (obj[name]==val) {
                    match=false;
                    return;
                }
            } else if (op=="in") {
                if (!_.includes(val,obj[name])) {
                    match=false;
                    break;
                }
            } else {
                throw new Error("Invalid operator: "+op);
            }
        }
        return match;
    }

    async search(cond,{order}={}) {
        console.log("search",this._name,cond);
        var data=[];
        await db.records.where("_model").equals(this._name).each(o=>{
            if (this._check_record(o,cond)) {
                data.push(o);
            }
        });
        console.log("data",data);
        if (order) {
            data=_.orderBy(data,order);
        }
        var ids=_.map(data,"id");
        console.log("=> search ids",ids);
        return ids;
    }

    async search_read(cond,fields,options) {
        console.log("search_read",this._name,cond,fields);
        var ids=await this.search(cond,options);
        var res=await this.read(ids,fields);
        return res;
    }

    async merge(vals) {
        console.log("merge",this._name,vals);
        if (!this._key) throw "Missing key";
        var cond=[];
        for (var n of this._key) {
            cond.push([n,"=",vals[n]])
        }
        var ids=await this.search(cond);
        if (ids.length>0) {
            var id=ids[0];
            await this.write([id],vals);
        } else {
            var id=await this.create(vals);
        }
        return id;
    }

    async read_path(ids,field_paths) {
        console.log("read_path",this._name,ids,field_paths);
        let field_names=[];
        let sub_paths={};
        field_paths.forEach(p=>{
            let i=p.indexOf(".");
            if (i==-1) {
                let n=p;
                field_names.push(n);
            } else {
                let n=p.substr(0,i);
                let sub_path=p.substr(i+1);
                field_names.push(n);
                if (!sub_paths[n]) sub_paths[n]=[];
                sub_paths[n].push(sub_path);
            }
        });
        field_names=_.uniq(field_names);
        let data=await this.read(ids,field_names,{load_m2o:false});
        let promises=[];
        field_names.forEach(n=>{
            let f=this._fields[n];
            let rpaths=sub_paths[n];
            if (!rpaths) return;
            if (f instanceof FieldMany2One) {
                promises.push((async ()=>{
                    let rids=[];
                    data.forEach(r=>{
                        let rid=r[n];
                        if (!rid) return;
                        rids.push(rid);
                    });
                    rids=_.uniq(rids);
                    if (!f.relation) throw new Error("Missing relation for field "+this._name+"."+n);
                    let mr=get_model(f.relation);
                    let res=await mr.read_path(rids,rpaths);
                    let rvals={};
                    res.forEach(r=>{
                        rvals[r.id]=r;
                    });
                    data.forEach(r=>{
                        let rid=r[n];
                        if (!rid) return;
                        r[n]=rvals[rid];
                    });
                })());
            } else if (f instanceof FieldOne2Many || f instanceof FieldMany2Many) {
                promises.push((async ()=>{
                    let rids=[];
                    data.forEach(r=>{
                        rids.push(...r[n]);
                    });
                    rids=_.uniq(rids);
                    if (!f.relation) throw new Error("Missing relation for field "+this._name+"."+n);
                    let mr=get_model(f.relation);
                    let res=await mr.read_path(rids,rpaths);
                    let rvals={};
                    res.forEach(r=>{
                        rvals[r.id]=r;
                    });
                    data.forEach(r=>{
                        r[n]=r[n].map(rid=>rvals[rid]);
                    });
                })());
            }
        });
        await Promise.all(promises);
        console.log("=> read_path result",this._name,data);
        return data;
    }

    async search_read_path(cond,field_paths,options) {
        console.log("search_read_path",this._name,cond,field_paths);
        var ids=await this.search(cond,options);
        var res=await this.read_path(ids,field_paths);
        return res;
    }
}

class Field {
    constructor({required=false,func=null,index=false,encrypt=false}={}) {
        this.store=true;
        this.func=func;
        if (func) {
            this.store=false;
        }
        this.index=index;
        this.encrypt=encrypt;
    }
}

class FieldChar extends Field {
    constructor(string,opts) {
        super(opts);
        this.string=string;
    }
}

class FieldText extends Field {
    constructor(string,opts) {
        super(opts);
        this.string=string;
    }
}

class FieldInteger extends Field {
    constructor(string,opts) {
        super(opts);
        this.string=string;
    }
}

class FieldDecimal extends Field {
    constructor(string,opts) {
        super(opts);
        this.string=string;
    }
}

class FieldDateTime extends Field {
    constructor(string,opts) {
        super(opts);
        this.string=string;
    }
}

class FieldSelection extends Field {
    constructor(selection,string,opts) {
        super(opts);
        this.selection=selection;
        this.string=string;
    }
}

class FieldMany2One extends Field {
    constructor(relation,string,opts) {
        super(opts);
        if (!opts) opts={};
        this.relation=relation;
        this.string=string;
    }
}

class FieldOne2Many extends Field {

    constructor(relation,relfield,string,opts) {
        console.log("FieldOne2Many",relation,relfield,string,opts);
        super(opts);
        this.relation=relation;
        this.relfield=relfield;
        this.string=string;
        this.store=false;
    }
}

class FieldMany2Many extends Field {
    constructor(relation,string,opts) {
        super(opts);
        this.relation=relation;
        this.string=string;
        this.store=false;
    }
}

function new_field(field_class) {
    return (...args)=>{
        return new field_class(...args);
    }
}

export const fields={
    Char: new_field(FieldChar),
    Text: new_field(FieldText),
    Integer: new_field(FieldInteger),
    Decimal: new_field(FieldDecimal),
    DateTime: new_field(FieldDateTime),
    Selection: new_field(FieldSelection),
    Many2One: new_field(FieldMany2One),
    One2Many: new_field(FieldOne2Many),
    Many2Many: new_field(FieldMany2Many),
};
