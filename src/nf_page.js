import 'bootstrap/dist/css/bootstrap.css';

var React=require("react");
var ReactDOM=require("react-dom");
var rpc=require("./rpc");
var utils=require("./utils");
var classNames = require('classnames');
var QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;
var numeral=require("numeral");
var moment=require("moment");
var _=require("lodash");
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import Dropzone from 'react-dropzone';
const Spinners=require("react-spinners");
//import DatePicker, { registerLocale }  from "react-datepicker";
var QRCode = require('qrcode.react');
var Barcode = require('react-barcode');
//var number_to_words=require("number-to-words");
var i18n=require("./i18n");
var t=i18n.translate;
import {Model,fields,get_model,init_db,get_db} from "./model";
import Dexie from "dexie";
var Modal = require('react-bootstrap').Modal;

var electron=require("electron");
window.electron=electron;

const dialog = require('electron').remote.dialog;
const serialport = require( "electron" ).remote.require( "serialport" );
window.serialport=serialport;

//import OwlCarousel from 'react-owl-carousel';  
//import 'owl.carousel/dist/assets/owl.carousel.css';  
//import 'owl.carousel/dist/assets/owl.theme.default.css'; 
//import Carousel from "react-multi-carousel";

// date picker in Thai
//import th from "date-fns/locale/th";
//registerLocale("th", th);

//KMN:we have translation now
//var t=x=>x;

class PageModel extends Model {
    constructor() {
        super()
        this._name="page.layout"
        this._key=["path"]
        this._fields={
            path: fields.Char("Path"),
            layout: fields.Text("Layout"),
            code: fields.Text("Layout"),
        }
    }
}
PageModel.register()

function construct(constructor, args) {
    function F() {
        return constructor.apply(this, args);
    }
    F.prototype = constructor.prototype;
    return new F();
}

function eval_with_context(ctx) {
    var args=_.keys(ctx);
    args.push("return function(expr) { return eval(expr) }");
    var f=construct(Function,args);
    var vals=_.values(ctx);
    return f.apply(this,vals);
}

function conv_size(s) {
    if (s==null) return null;
    if (_.isNumber(s)) return s;
    if (_.isString(s)) {
        if (s.endsWith("px")) {
            return parseInt(s.replace("px",""));
        } else if (s.endsWith("%")) {
            return s;
        } else {
            return parseInt(s)||null;
        }
    }
    return s;
}

function get_path_value(data,name) {
    //console.log("get_path_value",data,name);
    if (!name) return null;
    if (!data) data={};
    var i=name.indexOf(".");
    if (i==-1) return data[name];
    var name2=name.substr(0,i);
    var remain=name.substr(i+1);
    var data2=data[name2];
    return get_path_value(data2,remain);
}

function replace_field_values(str,data) {
    //console.log("replace_field_values",str);
    //var str=unescape(str);
    var res=str.replace(/\{fmt_money\((.*?)\)\}/g,(all,path)=>{
        var val=get_path_value(data,path);
        var val_str=utils.fmt_money(val);
        return val_str;
    });
    var res=res.replace(/\{fmt_int\((.*?)\)\}/g,(all,path)=>{
        var val=get_path_value(data,path);
        var val_str=""+parseInt(val);
        return val_str;
    });
    var res=res.replace(/\{fmt_hours\((.*?)\)\}/g,(all,path)=>{
        var val=get_path_value(data,path);
        var val_str=utils.fmt_hours(val);
        return val_str;
    });
    var res=res.replace(/\{fmt_date\((.*?),"(.*?)"\)\}/g,(all,path,fmt)=>{
        var val=get_path_value(data,path);
        var val_str=utils.fmt_date(val,fmt);
        return val_str;
    });
    var res=res.replace(/\{fmt_date\((.*?),\&quot;(.*?)\&quot;\)\}/g,(all,path,fmt)=>{
        var val=get_path_value(data,path);
        var val_str=utils.fmt_date(val,fmt);
        return val_str;
    });
    var res=res.replace(/\{fmt_words\((.*?)\)\}/g,(all,path)=>{
        var val=get_path_value(data,path);
        var val_str=number_to_words.toWords(val);
        return val_str;
    });
    var res=res.replace(/\{fmt_text\((.*?)\)\}/g,(all,text)=>{
        var val=t(text);
        return val;
    });
    var res=res.replace(/\{(.*?)\}/g,(all,path)=>{
        var val=get_path_value(data,path);
        var val_str;
        if (val==null) val_str="";
        else val_str=""+val;
        return val_str;
    });

    return res;
}

function replace_translations(str) {
    if (i18n.get_active_lang() === "en_US") return str;

    var m = str.match(">[^><]+</");
    if (!m || m.length != 1) {
        //console.log("cannot translate:",str);
        return str;
    }

    var text = m[0].slice(1,-2).trim();
    var ttext = t(text);
    if (text === ttext) return str;

    var res=str.replace(text,ttext);
    //console.log("trans:",text,ttext);
    return res;
}

class Element extends React.Component {
    render() {
        //console.log("Element.render",this.props);
        var comp=null;
        var type=this.props.el_props.type;
        if (type=="box") {
            comp=<Box {...this.props}/>;
        } else if (type=="text") {
            comp=<Text {...this.props}/>;
        } else if (type=="columns") {
            comp=<Columns {...this.props}/>;
        } else if (type=="button") {
            comp=<Button {...this.props}/>;
        } else if (type=="image") {
            comp=<Image {...this.props}/>;
        } else if (type=="table") {
            comp=<Table {...this.props}/>;
        } else if (type=="field") {
            comp=<Field {...this.props}/>;
        } else if (type=="nav") {
            comp=<Nav {...this.props}/>;
        } else if (type=="slider") {
            comp=<Slider {...this.props}/>;
        } else if (type=="block") {
            comp=<Block {...this.props}/>;
        } else if (type=="list") {
            comp=<List {...this.props}/>;
        } else if (type=="data") {
            comp=<Data {...this.props}/>;
        } else if (type=="overlay") {
            comp=<Overlay {...this.props}/>;
        } else if (type=="map") {
            comp=<Map {...this.props}/>;
        } else {
            throw new Error("Invalid element type: "+type);
        }
        return comp;
    }
}

class ElementList extends React.Component {
    render() {
        //console.log("ElementList.render",this.props);
        var comps=[];
        (this.props.elements||[]).forEach((el,i)=>{
            comps.push(<Element key={i} el_props={el} root={this.props.root} context={this.props.context}/>);
        });
        // XXX: change to return list with newer react version
        return <div style={{display:"flex",flexDirection:"column",flex:1}}>
            {comps}
        </div>
    }
}

class ScreenFilter extends React.Component {
    render() {
        var el_props=this.props.el_props;
        var over_size=this.props.over_size;
        var max_size=this.props.max_size;
        var hide=null;
        if (el_props) { // XXX
            if (!el_props.show_phone && el_props.show_tablet && el_props.show_desktop) {
                hide="d-none d-md-block";
            } else if (!el_props.show_phone && !el_props.show_tablet && el_props.show_desktop) {
                hide="d-none d-lg-block";
            } else if (el_props.show_phone && !el_props.show_tablet && !el_props.show_desktop) {
                hide="d-block d-md-none";
            } else if (el_props.show_phone && el_props.show_tablet && !el_props.show_desktop) {
                hide="d-block d-lg-none";
            }
        }
        if (over_size) {
            if (over_size=="desktop") {
                hide="d-none";
            } else if (over_size=="tablet") {
                hide="d-none d-lg-block";
            } else if (over_size=="phone") {
                hide="d-none d-md-block";
            }
        }
        if (max_size) {
            if (max_size=="phone") {
                hide="d-block d-md-none";
            } else if (max_size=="tablet") {
                hide="d-block d-lg-none";
            } else if (max_size=="desktop") {
                hide="d-block";
            }
        }
        return <div className={hide}>
            {this.props.children}
        </div>
    }
}

class Box extends React.Component {
    constructor(props) {
        super(props);
        this.state={el_props:props.el_props};
        var el_props=props.el_props;
        if (el_props.name) {
            this.props.root.register_component(el_props.name,this);
        }
    }

    render() {
        //console.log("Box.render",this.props);
        var style={};
        var el_props=this.state.el_props;
        if (el_props.dyn_props) {
            var ctx=Object.assign({},this.props.context);
            ctx.state=this.state;
            ctx.page_params=this.props.root.props;
            Object.assign(ctx,ctx.data||{});
            var dyn_props=null;
            try {
                dyn_props=this.props.root.code_eval("("+el_props.dyn_props+")",ctx);
            } catch (err) {
                console.log("Failed to evaluate dyn_props: "+err);
            }
            //console.log("=> dyn_props",dyn_props);
            if (dyn_props) {
                el_props=Object.assign({},el_props,dyn_props);
            }
        }
        if (el_props.hidden) return <p style={{display:"none"}}>Hidden</p>;
        if (el_props.min_height) style.minHeight=el_props.min_height;
        if (el_props.max_width) style.maxWidth=el_props.max_width;
        if (el_props.width) style.width=conv_size(el_props.width);
        if (el_props.height) style.height=el_props.height;
        if (el_props.background_color) style.backgroundColor=el_props.background_color;
        if (el_props.background_image) {
            var url=el_props.background_image;
            style.backgroundImage="url("+url+")";
        }
        if (el_props.background_repeat) {
            style.backgroundRepeat=el_props.background_repeat;
        }
        if (el_props.background_image_align) {
            style.backgroundPosition=el_props.background_image_align;
        }
        if (el_props.background_image_size) {
            style.backgroundSize=el_props.background_image_size;
        }
        if (el_props.parallax) {
            style.backgroundAttachment="fixed";
        }
        style.borderStyle="solid";
        style.borderWidth=el_props.border_width||0;
        style.borderRadius=el_props.border_radius||0;
        style.display="flex";
        if (el_props.border_color) style.borderColor=el_props.border_color;
        if (el_props.border_top_width!=null) style.borderTopWidth=el_props.border_top_width;
        if (el_props.border_right_width!=null) style.borderRightWidth=el_props.border_right_width;
        if (el_props.border_bottom_width!=null) style.borderBottomWidth=el_props.border_bottom_width;
        if (el_props.border_left_width!=null) style.borderLeftWidth=el_props.border_left_width;
        if (el_props.margin_top!=null) style.marginTop=el_props.margin_top;
        if (el_props.margin_right!=null) style.marginRight=el_props.margin_right;
        if (el_props.margin_bottom!=null) style.marginBottom=el_props.margin_bottom;
        if (el_props.margin_left!=null) style.marginLeft=el_props.margin_left;
        if (el_props.padding_top!=null) style.paddingTop=el_props.padding_top;
        if (el_props.padding_right!=null) style.paddingRight=el_props.padding_right;
        if (el_props.padding_bottom!=null) style.paddingBottom=el_props.padding_bottom;
        if (el_props.padding_left!=null) style.paddingLeft=el_props.padding_left;
        /*if (el_props.shadow_color) style.shadowColor=el_props.shadow_color;
        if (el_props.shadow_radius) style.shadowRadius=el_props.shadow_radius;
        if (el_props.shadow_offset_width||el_props.shadow_offset_height) style.shadowOffset={width:el_props.shadow_offset_width||0, height:el_props.shadow_offset_height||0};*/
        if (el_props.shadow_color) {
            style.boxShadow=""+(el_props.border_offset_width||0)+"px "+(el_props.border_offset_height||0)+"px "+(el_props.shadow_radius||0)+"px "+el_props.shadow_color+"";
        }
        var comp=<div style={style} onClick={this.on_click.bind(this)} onMouseEnter={this.on_mouse_enter.bind(this)} onMouseLeave={this.on_mouse_leave.bind(this)}>
            {/*<div>{JSON.stringify(el_props)}</div>*/}
            {(()=>{
                if (el_props.container) {
                    return <div className="container" style={{display:"flex"}}>
                        <ElementList elements={el_props.children} root={this.props.root} context={this.props.context}/>
                    </div>
                }
                return <ElementList elements={el_props.children} root={this.props.root} context={this.props.context}/>
            })()}
        </div>;
        if (el_props.show_desktop || el_props.show_tablet || el_props.show_phone) {
            comp=<ScreenFilter el_props={el_props}>
                {comp}
            </ScreenFilter>;
        }
        if (el_props.footer) {
            comp=<div className="nf-footer">
                {comp}
            </div>;
        }
        if (el_props.link_action) {
            var url="/?page="+el_props.link_action;
            if (el_props.link_action_options) {
                var ctx=Object.assign({},this.props.context);
                Object.assign(ctx,ctx.data||{})
                var opts=this.props.root.code_eval("("+el_props.link_action_options+")",ctx);
                var qs=utils.make_qs(opts);
                url+="&"+qs;
            }
            var link_style={color:"inherit",fontDecoration:"inherit"};
            if (el_props.width) link_style.width=conv_size(el_props.width);
            comp=<a href={url} onClick={this.on_click.bind(this)} style={link_style}>
                {comp}
            </a>;
        }
        return comp;
    }

    on_mouse_enter() {
        this.setState({hover:true});
    }

    on_mouse_leave() {
        this.setState({hover:false});
    }

    on_click(e) {
        var el_props=this.props.el_props;
        if (!el_props.link_action && !el_props.on_click) return;
        console.log("Box.on_click");
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
		if (this.state.loading) return;
        if (el_props.link_action) {
            var opts={};
            if (el_props.link_action_options) {
                var ctx=Object.assign({},this.props.context);
                Object.assign(ctx,ctx.data||{})
                opts=this.props.root.code_eval("("+el_props.link_action_options+")",ctx);
            }
            this.props.root.set_page(el_props.link_action,opts);
        }
        var on_click=el_props.on_click;
        if (on_click) {
            var ctx=Object.assign({},this.props.context);
            Object.assign(ctx,ctx.data||{})
            var res=this.props.root.code_eval(on_click,ctx);
            if (res) {
                this.setState({loading:true});
                res.then(()=>{
                    this.setState({loading:false});
                }).catch(err=>{
                    console.error(err);
                    this.setState({loading:false});
                });
            }
        }
    }

    set_props(props) {
        //console.log("Box.set_props",props);
        Object.assign(this.state.el_props,props);
        this.forceUpdate();
    }

    get_props() {
        //console.log("Box.get_props");
        return this.state.el_props;
    }
}

class Loading extends React.Component {
    render() {
        return <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
            {(()=>{
                var type=this.props.type||"bar";
                var color=this.props.color;
                var size=this.props.size;
                if (type=="bar") {
                    return <Spinners.BarLoader color={color}/>
                } else if (type=="beat") {
                    return <Spinners.BeatLoader color={color}/>
                } else if (type=="bounce") {
                    return <Spinners.BounceLoader color={color}/>
                } else if (type=="circle") {
                    return <Spinners.CircleLoader color={color}/>
                } else if (type=="clip") {
                    return <Spinners.ClipLoader color={color}/>
                } else if (type=="climb") {
                    return <Spinners.ClimbingBoxLoader color={color}/>
                } else if (type=="dot") {
                    return <Spinners.DotLoader color={color}/>
                } else if (type=="fade") {
                    return <Spinners.FadeLoader color={color}/>
                } else if (type=="grid") {
                    return <Spinners.GridLoader color={color}/>
                } else if (type=="hash") {
                    return <Spinners.HashLoader color={color}/>
                } else if (type=="moon") {
                    return <Spinners.MoonLoader color={color}/>
                } else if (type=="pacman") {
                    return <Spinners.PacmanLoader color={color}/>
                } else if (type=="propagate") {
                    return <Spinners.PropagateLoader color={color}/>
                } else if (type=="pulse") {
                    return <Spinners.PulseLoader color={color}/>
                } else if (type=="ring") {
                    return <Spinners.RingLoader color={color}/>
                } else if (type=="rise") {
                    return <Spinners.RiseLoader color={color}/>
                } else if (type=="rotate") {
                    return <Spinners.RotateLoader color={color}/>
                } else if (type=="scale") {
                    return <Spinners.ScaleLoader color={color}/>
                } else if (type=="sync") {
                    return <Spinners.SyncLoader color={color}/>
                } else {
                    return <div>Loading...</div>;
                }
            })()}
        </div>
    }
}

class Data extends React.Component {
    constructor(props) {
        super(props);
        this.state={};
    }

    componentDidMount() {
        this.load_data();
    }

    async load_data() {
        var el_props=this.props.el_props;
        var model=el_props.model;
        if (!model) {
            var err="Missing model";
            this.setState({error:err});
            return;
        }
        var cond=[];
        if (el_props.condition) {
            try {
                var ctx=Object.assign({},this.props.context);
                Object.assign(ctx,ctx.data||{})
                ctx.page_params=this.props.root.props;
                cond=this.props.root.code_eval("("+el_props.condition+")",ctx);
            } catch (err) {
                console.error("Failed to evaluate condition",err);
            }
        }
        var fields=[];
        if (el_props.fields) fields=JSON.parse(el_props.fields);
        var method;
        try {
            var opts={};
            if (el_props.limit) opts.limit=el_props.limit;
            var data=await rpc.execute(model,"search_read_path",[cond,fields],opts);
            if (el_props.read_type=="read_one") {
                data=data[0]||{};
            }
            console.log("Data => data",data);
            this.setState({data:data,error:null});
        } catch (err) {
            this.setState({error:err});
        }
    }

    render() {
        let el_props=this.props.el_props;
        var data=this.state.data;
        if (!data) return <Loading type={el_props.spinner_type} color={el_props.spinner_color} size={el_props.spinner_size}/>;
        var ctx=Object.assign({},this.props.context);
        if (!ctx.data) ctx.data={};
        ctx.data.data=data;
        return <div>
            {(()=>{
                if (!el_props.debug) return;
                return <div style={{backgroundColor:"blue",color:"#fff",padding:5}}>Debug data: {JSON.stringify(data)}</div>
            })()}
            <ElementList elements={el_props.children||[]} root={this.props.root} context={ctx}/>
        </div>;
    }
}

class List extends React.Component {
    render() {
        let el_props=this.props.el_props;
        let style={position:"relative"};
        if (el_props.margin_top!=null) style.marginTop=el_props.margin_top;
        if (el_props.margin_right!=null) style.marginRight=el_props.margin_right;
        if (el_props.margin_bottom!=null) style.marginBottom=el_props.margin_bottom;
        if (el_props.margin_left!=null) style.marginLeft=el_props.margin_left;
        var cont_style={};
        if (el_props.direction=="row") {
            cont_style.display="flex";
            cont_style.flexDirection="column";
            cont_style.flexWrap="wrap";
            cont_style.flexDirection=el_props.direction;
        }
        if (el_props.col_spacing) {
            cont_style.marginLeft=-el_props.col_spacing;
        }
        if (el_props.row_spacing) {
            cont_style.marginTop=-el_props.row_spacing;
        }
        var list_comp=<div key={el_props.type} style={style}>
            {(()=>{
                var context=this.props.context||{};
                var data=context.data||{};
                var list_val=get_path_value(data,el_props.name);
                //console.log("List list_val",list_val);
                if (list_val==null) {
                    return <Loading/>;
                } else if (list_val.length==0) {
                    if (el_props.empty_text) {
                        return <p>{el_props.empty_text||"There are no items to display."}</p>;
                    }
                    return <div/>;
                }
                return <div style={cont_style}>
                    {/*<div>list data: {JSON.stringify(list_val)}</div>*/}
                    {list_val.map((obj,i)=>{
                        var el=el_props.child;
                        var ctx=Object.assign({},context);
                        ctx.data=obj;
                        ctx.data._index=i+1;
                        var comp=null;
                        if (el) {
                            comp=<Element key={i} el_props={el} root={this.props.root} context={ctx}/>;
                        }
                        if (el_props.num_cols) {
                            var item_style={};
                            item_style.width="calc(100%/"+el_props.num_cols+")";
                            if (el_props.col_spacing) {
                                item_style.paddingLeft=el_props.col_spacing;
                            }
                            if (el_props.row_spacing) {
                                item_style.paddingTop=el_props.row_spacing;
                            }
                            return <div key={i} style={item_style}>
                                {comp}
                            </div>
                        } else {
                            return comp;
                        }
                    })}
                </div>
            })()}
        </div>;
        if (el_props.show_desktop || el_props.show_tablet || el_props.show_phone) {
            return <ScreenFilter el_props={el_props}>
                {list_comp}
            </ScreenFilter>;
        } else if (el_props.folding) {
            var fold_comp=<div key={el_props.type} style={style}>
                {(()=>{
                    var context=this.props.context||{};
                    var data=context.data||{};
                    var list_val=get_path_value(data,el_props.name);
                    console.log("List list_val",list_val);
                    if (list_val==null) {
                        return <Loading/>;
                    } else if (list_val.length==0) {
                        if (el_props.empty_text) {
                            return <p>{el_props.empty_text||"There are no items to display."}</p>;
                        }
                        return <div/>;
                    }
                    return <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                        {/*<div>list data: {JSON.stringify(list_val)}</div>*/}
                        {list_val.map((obj,i)=>{
                            var el=el_props.child;
                            var ctx=Object.assign({},context);
                            ctx.data=obj;
                            ctx.data._index=i+1;
                            var comp=null;
                            if (el) {
                                comp=<Element key={i} el_props={el} root={this.props.root} context={ctx}/>;
                            }
                            return comp;
                        })}
                    </div>
                })()}
            </div>;
            return <div>
                <ScreenFilter over_size={el_props.folding}>
                    {list_comp}
                </ScreenFilter>
                <ScreenFilter max_size={el_props.folding}>
                    {fold_comp}
                </ScreenFilter>
            </div>;
        } else {
            return list_comp;
        }
    }
}

class Text extends React.Component {
    constructor(props) {
        super(props);
        this.state={};
    }

    render() {
        //console.log("Text.render",this.props);
        var style={};
        var el_props=this.props.el_props;
        if (el_props.dyn_props) {
            var ctx=Object.assign({},this.props.context);
            ctx.state=this.state;
            ctx.page_params=this.props.root.props;
            Object.assign(ctx,ctx.data||{});
            var dyn_props=null;
            try {
                dyn_props=this.props.root.code_eval("("+el_props.dyn_props+")",ctx);
            } catch (err) {
                console.log("Failed to evaluate dyn_props: "+err);
            }
            //console.log("=> dyn_props",dyn_props);
            if (dyn_props) {
                el_props=Object.assign({},el_props,dyn_props);
            }
        }
        //KMN if (el_props.hidden) return <div/>;
        if (el_props.hidden) return <div style={{display:"none"}}/>;
        if (el_props.width) style.width=el_props.width+"px";
        if (el_props.height) style.height=el_props.height+"px";
        if (el_props.min_height) style.minHeight=el_props.min_height;
        if (el_props.background_color) style.backgroundColor=el_props.background_color;
        if (el_props.color) style.color=el_props.color;
        if (el_props.margin_top!=null) style.marginTop=el_props.margin_top;
        if (el_props.margin_right!=null) style.marginRight=el_props.margin_right;
        if (el_props.margin_bottom!=null) style.marginBottom=el_props.margin_bottom;
        if (el_props.margin_left!=null) style.marginLeft=el_props.margin_left;
        if (el_props.padding_top!=null) style.paddingTop=el_props.padding_top;
        if (el_props.padding_right!=null) style.paddingRight=el_props.padding_right;
        if (el_props.padding_bottom!=null) style.paddingBottom=el_props.padding_bottom;
        if (el_props.padding_left!=null) style.paddingLeft=el_props.padding_left;
        style.borderStyle="solid";
        style.borderWidth=el_props.border_width||0;
        style.borderRadius=el_props.border_radius||0;
        if (el_props.border_color) style.borderColor=el_props.border_color;
        if (el_props.border_top_width!=null) style.borderTopWidth=el_props.border_top_width;
        if (el_props.border_right_width!=null) style.borderRightWidth=el_props.border_right_width;
        if (el_props.border_bottom_width!=null) style.borderBottomWidth=el_props.border_bottom_width;
        if (el_props.border_left_width!=null) style.borderLeftWidth=el_props.border_left_width;
        if (el_props.field) { // KMN: support embed html
            var ctx=this.props.context||{};
            var data=ctx.data||{};
            var html=get_path_value(data,el_props.field);
        } else {
            var delta_ops=[];
            if (el_props.contents && el_props.contents.ops) {
                delta_ops=el_props.contents.ops;
            }
            var cfg = {
                linkTarget: "", 
            };
            var converter = new QuillDeltaToHtmlConverter(delta_ops, cfg);
            var html=converter.convert();
            var ctx=this.props.context||{};
            var data=ctx.data||{};
            html=replace_field_values(html,data);
            html=replace_translations(html);
            html=html.replace(/\n/g,"<br/>");
        }
        var text_style={
            fontSize: 14,
        };
        if (el_props.color) text_style.color=el_props.color;
        if (el_props.align) text_style.textAlign=el_props.text_align;
        if (el_props.font_size) text_style.fontSize=el_props.font_size;
        if (el_props.font_bold) text_style.fontWeight="bold";
        if (el_props.font_name) text_style.fontFamily=""+el_props.font_name;
        if (el_props.letter_spacing) text_style.letterSpacing=""+el_props.letter_spacing+"px";
        //console.log("text html",html,data);
        var comp=<div style={style} onClick={this.on_click.bind(this)} onMouseEnter={this.on_mouse_enter.bind(this)} onMouseLeave={this.on_mouse_leave.bind(this)}>
            <div dangerouslySetInnerHTML={{__html:html}} className="ql-viewer" style={text_style}/>
        </div>;
        if (el_props.link_action || el_props.on_click) {
            if (el_props.link_action) {
                var url="/?page="+el_props.link_action;
                if (el_props.link_action_options) {
                    var ctx=Object.assign({},this.props.context);
                    Object.assign(ctx,ctx.data||{})
                    var opts=this.props.root.code_eval("("+el_props.link_action_options+")",ctx);
                    var qs=utils.make_qs(opts);
                    url+="&"+qs;
                }
            } else {
                url="#";
            }
            comp=<a href={url} onClick={this.on_click.bind(this)} style={{color:"inherit",fontDecoration:"inherit"}}>
                {comp}
            </a>;
        }
        return comp;
    }

    on_mouse_enter() {
        this.setState({hover:true});
    }

    on_mouse_leave() {
        this.setState({hover:false});
    }

    on_click(e) {
        console.log("Text.on_click");
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
		if (this.state.loading) return;
        var el_props=this.props.el_props;
        if (el_props.link_action) {
            var opts={};
            if (el_props.link_action_options) {
                var ctx=Object.assign({},this.props.context);
                Object.assign(ctx,ctx.data||{})
                opts=this.props.root.code_eval("("+el_props.link_action_options+")",ctx);
            }
            this.props.root.set_page(el_props.link_action,opts);
        }
        var on_click=el_props.on_click;
        if (on_click) {
            var res=this.props.root.code_eval(on_click);
            if (res) {
                this.setState({loading:true});
                res.then(()=>{
                    this.setState({loading:false});
                }).catch(err=>{
                    console.error(err);
                    this.setState({loading:false});
                });
            }
        }
    }
}

class Columns extends React.Component {
    constructor(props) {
        super(props);
        this.state={el_props:props.el_props};
        var el_props=props.el_props;
        if (el_props.name) {
            this.props.root.register_component(el_props.name,this);
        }
    }

    render() {
        //console.log("Columns.render",this.props);
        var style={position:"relative"};
        var el_props=this.props.el_props;
        if (el_props.dyn_props) {
            var ctx=Object.assign({},this.props.context);
            ctx.state=this.state;
            ctx.page_params=this.props.root.props;
            Object.assign(ctx,ctx.data||{});
            var dyn_props=null;
            try {
                dyn_props=this.props.root.code_eval("("+el_props.dyn_props+")",ctx);
            } catch (err) {
                console.log("Failed to evaluate dyn_props: "+err);
            }
            //console.log("=> dyn_props",dyn_props);
            if (dyn_props) {
                el_props=Object.assign({},el_props,dyn_props);
            }
        }
        if (el_props.hidden) return <div/>;
        if (el_props.vertical_align) {
            var map={
                middle: "center",
            };
            style.alignItems=map[el_props.vertical_align];
        }
        if (el_props.min_height) style.minHeight=el_props.min_height;
        if (el_props.max_width) style.maxWidth=el_props.max_width;
        if (el_props.height) style.height=el_props.height;
        if (el_props.background_color) style.backgroundColor=el_props.background_color;
        if (el_props.color) style.color=el_props.color;
        if (el_props.background_image) {
            var url=el_props.background_image;
            style.backgroundImage="url("+url+")";
            style.backgroundSize="cover";
            style.backgroundRepeat="no-repeat";
        }
        style.borderStyle="solid";
        style.borderWidth=el_props.border_width||0;
        style.borderRadius=el_props.border_radius||0;
        //style.display="flex";
        if (el_props.border_color) style.borderColor=el_props.border_color;
        if (el_props.border_top_width!=null) style.borderTopWidth=el_props.border_top_width;
        if (el_props.border_right_width!=null) style.borderRightWidth=el_props.border_right_width;
        if (el_props.border_bottom_width!=null) style.borderBottomWidth=el_props.border_bottom_width;
        if (el_props.border_left_width!=null) style.borderLeftWidth=el_props.border_left_width;
        if (el_props.margin_top!=null) style.marginTop=el_props.margin_top;
        if (el_props.margin_right!=null) style.marginRight=el_props.margin_right;
        if (el_props.margin_bottom!=null) style.marginBottom=el_props.margin_bottom;
        if (el_props.margin_left!=null) style.marginLeft=el_props.margin_left;
        if (el_props.padding_top!=null) style.paddingTop=el_props.padding_top;
        if (el_props.padding_right!=null) style.paddingRight=el_props.padding_right;
        if (el_props.padding_bottom!=null) style.paddingBottom=el_props.padding_bottom;
        if (el_props.padding_left!=null) style.paddingLeft=el_props.padding_left;
        if (el_props.num_cols==null) {
            el_props.num_cols=2;
        }
        if (el_props.flex_wrap!=null) style.flexWrap="wrap"; // KMN: wrap added in header/menu/dyn_props
        var num_cols=el_props.num_cols;
        var cols_style=Object.assign({display:"flex",flexDirection:"row"},style);
        if (el_props.align) {
            cols_style.justifyContent={left:"flex-start",right:"flex-end",center:"center"}[el_props.align];
        }
        var cols_comp=<div style={cols_style}>
            {(()=>{
                var comps=[];
                if (!el_props.columns) el_props.columns=[];
                if (!el_props.col_widths||el_props.col_widths.length!=num_cols) {
                    el_props.col_widths=[];
                    for (var i=0; i < num_cols; i++) {
                        el_props.col_widths.push(1);
                    }
                }
                var col_widths=el_props.col_widths;
                for (var i=0; i < num_cols; i++) {
                    if (!el_props.columns[i]) {
                        el_props.columns[i]={
                            children: [],
                        };
                    }
                    var w=col_widths[i]||null;
                    comps.push(<div key={i} style={{flex:w,position:"relative",display:"flex",flexDirection:"column"}}>
                        <ElementList elements={el_props.columns[i].children} root={this.props.root} context={this.props.context}/>
                    </div>);
                }
                return comps;
            })()}
        </div>;
        var fold_comp=<div style={style}>
            {(()=>{
                var comps=[];
                for (var i=0; i < num_cols; i++) {
                    comps.push(<div key={i} style={{display:"flex",flexDirection:"column"}}>
                        <ElementList elements={el_props.columns[i].children} root={this.props.root} context={this.props.context}/>
                    </div>);
                }
                return comps;
            })()}
        </div>;
        if (el_props.folding) {
            var comp=<div>
                <ScreenFilter over_size={el_props.folding}>
                    {cols_comp}
                </ScreenFilter>
                <ScreenFilter max_size={el_props.folding}>
                    {fold_comp}
                </ScreenFilter>
            </div>;
        } else {
            var comp=cols_comp;
        }
        if (el_props.show_desktop || el_props.show_tablet || el_props.show_phone) {
            return <ScreenFilter el_props={el_props}>
                {comp}
            </ScreenFilter>;
        } else {
            return comp;
        }
    }

    set_props(props) {
        //console.log("Columns.set_props",props);
        Object.assign(this.state.el_props,props);
        this.forceUpdate();
    }

    get_props() {
        //console.log("Columns.get_props");
        return this.state.el_props;
    }
}

class Button extends React.Component {
    constructor(props) {
        super(props);
        this.state={};
    }

    render() {
        //console.log("Button.render",this.props);
        var el_props=this.props.el_props;
        if (el_props.dyn_props) {
            var ctx=Object.assign({},this.props.context);
            Object.assign(ctx,ctx.data||{});
            var dyn_props=null;
            try {
                dyn_props=this.props.root.code_eval("("+el_props.dyn_props+")",ctx);
            } catch (err) {
                console.log("Failed to evaluate dyn_props: "+err);
            }
            //console.log("=> dyn_props",dyn_props);
            if (dyn_props) {
                el_props=Object.assign({},el_props,dyn_props);
            }
        }
        if (el_props.hidden) return <div/>;
        var div_style={};
        var style={};
        style.outline="none";
        if (el_props.height) style.height=el_props.height;
        if (el_props.background_color) style.backgroundColor=el_props.background_color;
        if (el_props.color) style.color=el_props.color;
        if (el_props.border_color) style.borderColor=el_props.border_color;
        if (el_props.font_size) style.fontSize=el_props.font_size;
        if (el_props.font_bold) div_style.fontWeight="bold";
        style.borderWidth=1;
        if (el_props.border_width!=null) {
            style.borderWidth=el_props.border_width;
        }
        style.borderRadius=el_props.border_radius||0;
        if (el_props.border_top_width!=null) style.borderTopWidth=el_props.border_top_width;
        if (el_props.border_right_width!=null) style.borderRightWidth=el_props.border_right_width;
        if (el_props.border_bottom_width!=null) style.borderBottomWidth=el_props.border_bottom_width;
        if (el_props.border_left_width!=null) style.borderLeftWidth=el_props.border_left_width;
        if (el_props.margin_top!=null) div_style.marginTop=el_props.margin_top;
        if (el_props.margin_right!=null) div_style.marginRight=el_props.margin_right;
        if (el_props.margin_bottom!=null) div_style.marginBottom=el_props.margin_bottom;
        if (el_props.margin_left!=null) div_style.marginLeft=el_props.margin_left;
        if (el_props.padding_top!=null) style.paddingTop=el_props.padding_top;
        if (el_props.padding_right!=null) style.paddingRight=el_props.padding_right;
        if (el_props.padding_bottom!=null) style.paddingBottom=el_props.padding_bottom;
        if (el_props.padding_left!=null) style.paddingLeft=el_props.padding_left;
        if (el_props.width) style.width=el_props.width;
        if (el_props.height) style.height=el_props.height;
        if (el_props.align!=null) div_style.textAlign=el_props.align;
		style.cursor="pointer"; // XXX
        if (el_props.font_bold) style.fontWeight="bold";
        if (el_props.font_name) style.fontFamily=""+el_props.font_name;
        if (el_props.letter_spacing) style.letterSpacing=""+el_props.letter_spacing+"px";
		if (this.state.loading) style.disabled=true;
        return <div key={el_props.type} style={div_style}>
			{(()=>{
				if (el_props.link_url) {
					return <Link href={el_props.link_url}>
                        <a target={el_props.link_target}>
                            <button style={style} onClick={this.on_click.bind(this)}>
                                {(()=>{
                                    if (!el_props.icon) return;
                                    return <span className={"fa fa-"+el_props.icon} style={{marginRight:5}}/>
                                })()}
                                {t(el_props.text)}
                            </button>
                        </a>
					</Link>
				}
				return <button style={style} onClick={this.on_click.bind(this)} disabled={this.state.loading==true}>
					{(()=>{
						if (!el_props.icon) return;
						return <span className={"fa fa-"+el_props.icon} style={{marginRight:el_props.text?5:null}}/>
					})()}
                    {(()=>{
                        if (this.state.loading) return t("Please wait...");
					    return t(el_props.text);
                    })()}
				</button>
			})()}
        </div>
    }

    on_click(e) {
        e.stopPropagation();
        e.preventDefault();
		if (this.state.loading) return;
        var el_props=this.props.el_props;
        if (el_props.link_action) {
            var opts={};
            if (el_props.link_action_options) {
                var ctx=Object.assign({},this.props.context);
                Object.assign(ctx,ctx.data||{})
                opts=this.props.root.code_eval("("+el_props.link_action_options+")",ctx);
            }
            this.props.root.set_page(el_props.link_action,opts);
        }
        var on_click=el_props.on_click;
        if (on_click) {
            var ctx=Object.assign({},this.props.context);
            Object.assign(ctx,ctx.data||{})
            console.log("button on_click",ctx);
			//alert("id="+ctx.data.id+" "+on_click);
            var res=this.props.root.code_eval(on_click,ctx);
            if (res) {
                this.setState({loading:true});
                res.then(()=>{
                    this.setState({loading:false});
                }).catch(err=>{
                    alert(t("Error")+": "+t(err));
                    this.setState({loading:false});
                });
            }
        }
    }
}

class Image extends React.Component {
    constructor(props) {
        super(props);
        this.state={};
    }

    render() {
        //console.log("Image.render",this.props);
        var el_props=this.props.el_props;
        if (el_props.dyn_props) {
            var ctx=Object.assign({},this.props.context);
            ctx.state=this.state;
            ctx.page_params=this.props.root.props;
            Object.assign(ctx,ctx.data||{});
            var dyn_props=null;
            try {
                dyn_props=this.props.root.code_eval("("+el_props.dyn_props+")",ctx);
            } catch (err) {
                console.log("Failed to evaluate dyn_props: "+err);
            }
            //console.log("=> dyn_props",dyn_props);
            if (dyn_props) {
                el_props=Object.assign({},el_props,dyn_props);
            }
        }
        if (el_props.hidden) return <div/>;
        var div_style={position:"relative"};
        var style={};
        if (el_props.width) style.width=conv_size(el_props.width);
        if (el_props.height) style.height=conv_size(el_props.height);
        if (el_props.margin_top!=null) div_style.marginTop=el_props.margin_top;
        if (el_props.margin_right!=null) div_style.marginRight=el_props.margin_right;
        if (el_props.margin_bottom!=null) div_style.marginBottom=el_props.margin_bottom;
        if (el_props.margin_left!=null) div_style.marginLeft=el_props.margin_left;
        if (el_props.align!=null) div_style.textAlign=el_props.align;
        if (el_props.background_color) div_style.backgroundColor=el_props.background_color;
        if (el_props.padding_top!=null) div_style.paddingTop=el_props.padding_top;
        if (el_props.padding_right!=null) div_style.paddingRight=el_props.padding_right;
        if (el_props.padding_bottom!=null) div_style.paddingBottom=el_props.padding_bottom;
        if (el_props.padding_left!=null) div_style.paddingLeft=el_props.padding_left;
        style.borderStyle="solid";
        style.borderWidth=el_props.border_width||0;
        style.borderRadius=el_props.border_radius||0;
        if (el_props.border_color) style.borderColor=el_props.border_color;
        var link_url=el_props.link_url;
        var ctx=this.props.context||{};
        var data=ctx.data||{};
        var url=null;
        if (el_props.field) {
            var fname=get_path_value(data,el_props.field);
            if (fname) {
                url=rpc.get_file_uri(fname);
            }
        }
        if (!url && el_props.image_file) {
            url=rpc.get_file_uri(el_props.image_file);
        }
        if (!url && el_props.url) {
            url=el_props.url;
        }
        if (!url) {
            url="https://via.placeholder.com/350x150";
        }
        url=replace_field_values(url,data);
        var comp=<div style={div_style}>
            {/*<div>URL: {url}, fname2: {fname}, props: {JSON.stringify(el_props)}</div>*/}
            {(()=>{
                if (el_props.image_size) return;
                if (el_props.barcode_type) return;
                if (link_url) {
                    return <a href={link_url} target={el_props.link_target}><img src={url} style={style}/></a>
                } else {
                    return <img src={url} style={style}/>
                }
            })()}
            {(()=>{
                if (!el_props.image_size) return;
                style.backgroundImage="url(\""+url+"\")";
                style.backgroundRepeat="no-repeat";
                style.backgroundSize=el_props.image_size;
                if (el_props.blur) {
                    style.filter = "blur(2px)";
                    style.WebkitFilter = "blur(2px)";
                }
                if (el_props.align) {
                    style.backgroundPosition=el_props.align; // XXX
                }
                return <div style={style}/>
            })()}
            {(()=>{
                if (el_props.barcode_type!="qr") return;
                var ctx=this.props.context||{};
                var data=ctx.data||{};
                var expr=el_props.barcode_value||"";
                var val=replace_field_values(expr,data);
                //console.log("barcode qr",val);
                return <QRCode value={val} style={style}/>
            })()}
            {(()=>{
                if (el_props.barcode_type!="code128") return;
                var ctx=this.props.context||{};
                var data=ctx.data||{};
                var expr=el_props.barcode_value||"";
                var val=replace_field_values(expr,data);
                //console.log("barcode code128",val);
                var h=parseInt(el_props.height)||null;
                var bw=parseFloat(el_props.bar_width)||null;
                return <Barcode value={val} displayValue={false} style={style} height={h} width={bw}/>
            })()}
        </div>;
        if (el_props.link_action || el_props.on_click) {
            /*
            var url="/?page="+el_props.link_action;
            if (el_props.link_action_options) {
                var ctx=Object.assign({},this.props.context);
                Object.assign(ctx,ctx.data||{})
                try {
                    var opts=this.props.root.code_eval("("+el_props.link_action_options+")",ctx);
                    var qs=utils.make_qs(opts);
                    url+="&"+qs;
                } catch (err) {
                    console.log("Failed to evaluate link_action_options: "+err);
                }
            }*/
            /*comp=<Link href={url}>
                <a onClick={this.on_click.bind(this)} style={{color:"inherit",fontDecoration:"inherit"}}>
                    {comp}
                </a>
            </Link>;*/
            comp=<a onClick={this.on_click.bind(this)} style={{color:"inherit",fontDecoration:"inherit",cursor:"pointer"}}>
                {comp}
            </a>;
        }
        return comp;
    }

    on_click(e) {
        if (e) e.preventDefault();
		if (this.state.loading) return;
        var el_props=this.props.el_props;
        if (el_props.link_action) {
            var opts={};
            if (el_props.link_action_options) {
                var ctx=Object.assign({},this.props.context);
                Object.assign(ctx,ctx.data||{})
                try {
                    opts=this.props.root.code_eval("("+el_props.link_action_options+")",ctx);
                } catch (err) {
                    console.log("Failed to evaluate link_action_options: "+err);
                }
            }
            this.props.root.set_page(el_props.link_action,opts);
        }
        var on_click=el_props.on_click;
        if (on_click) {
            var ctx=Object.assign({},this.props.context);
            Object.assign(ctx,ctx.data||{})
            var res=this.props.root.code_eval(on_click,ctx);
            if (res) {
                this.setState({loading:true});
                res.then(()=>{
                    this.setState({loading:false});
                }).catch(err=>{
                    console.error(err);
                    this.setState({loading:false});
                });
            }
        }
    }
}

class Table extends React.Component {
    constructor(props) {
        super(props);
        this.state={};
    }

    render() {
        //console.log("Table.render",this.props);
        var el_props=this.props.el_props;
        var div_style={position:"relative"};
        var style={};
        var table_cell_style={};
        if (el_props.width!=null) style.width=el_props.width;
        if (el_props.height!=null) style.height=el_props.height;
        if (el_props.margin_top!=null) div_style.marginTop=el_props.margin_top;
        if (el_props.margin_right!=null) div_style.marginRight=el_props.margin_right;
        if (el_props.margin_bottom!=null) div_style.marginBottom=el_props.margin_bottom;
        if (el_props.margin_left!=null) div_style.marginLeft=el_props.margin_left;
        if (el_props.align!=null) div_style.textAlign=el_props.align;
        if (el_props.background_color) div_style.backgroundColor=el_props.background_color;
        if (el_props.padding_top!=null) table_cell_style.paddingTop=el_props.padding_top;
        if (el_props.padding_right!=null) table_cell_style.paddingRight=el_props.padding_right;
        if (el_props.padding_bottom!=null) table_cell_style.paddingBottom=el_props.padding_bottom;
        if (el_props.padding_left!=null) table_cell_style.paddingLeft=el_props.padding_left;
        var table_bordered=false;
        if (el_props.table_bordered!=null) table_bordered=el_props.table_bordered;
        var table_striped=el_props.table_striped;
        var table_hover=el_props.table_hover;
        var num_cols=el_props.num_cols||2;
        var num_rows=el_props.num_rows||2;
        table_cell_style.borderWidth=0; // XXX
        if (el_props.border_color) {
            table_cell_style.borderColor=el_props.border_color;
        }
        var widths=[];
        if (el_props.col_widths) {
            var total=0;
            _.forEach(el_props.col_widths,w=>{
                total+=w||0;
            });
            _.forEach(el_props.col_widths,(w,i)=>{
                if (w) {
                    var percent=100*w/total;
                    widths[i]=percent;
                }
            });
        }
        var context=this.props.context||{};
        var data=context.data||{};
        if (el_props.field_rows) {
            var list_val=get_path_value(data,el_props.field_rows);
            if (list_val==null) {
                return <Loading/>;
            } else if (list_val.length==0) {
                return <p>{el_props.empty_rows_text||"There are no items to display."}</p>;
            }
        }
        return <div style={div_style}>
            <table className={classNames("table",{"table-bordered":table_bordered,"table-hover":table_hover,"table-striped":table_striped})}>
                <tbody>
                    {(()=>{
                        var rows=[];
                        if (!el_props.elements) el_props.elements=[];
                        for (var i=0; i < num_rows; i++) {
                            if (!el_props.elements[i]) el_props.elements[i]=[];
                            if (el_props.field_rows && i==1) {
                                var context=this.props.context||{};
                                var data=context.data||{};
                                var list_val=get_path_value(data,el_props.field_rows)||[];
                                if (el_props.order_rows) {
                                    var c=el_props.order_rows;
                                    list_val=_.orderBy(list_val,c);
                                }
                                list_val.forEach((obj,k)=>{
                                    var ctx=Object.assign({},context);
                                    ctx.data=obj;
                                    ctx.data._index=k+1;
                                    rows.push(<tr key={k}>
                                        {(()=>{
                                            var cols=[];
                                            for (var j=0; j < num_cols; j++) {
                                                var cell_style=Object.assign({},table_cell_style);
                                                if (el_props.vertical_align) {
                                                    cell_style.verticalAlign=el_props.vertical_align;
                                                }
                                                var percent=widths[j];
                                                if (percent) cell_style.width=""+percent+"%";
                                                cols.push(<td key={j} style={cell_style}>
                                                    {(()=>{
                                                        var el=el_props.elements[i][j];
                                                        if (el) {
                                                            return <Element el_props={el} root={this.props.root} context={ctx}/>
                                                        }
                                                    })()}
                                                </td>);
                                            }
                                            return cols;
                                        })()}
                                    </tr>);
                                });
                            } else {
                                rows.push(<tr>
                                    {(()=>{
                                        var cols=[];
                                        for (var j=0; j < num_cols; j++) {
                                            var cell_style=Object.assign({},table_cell_style);
                                            if (el_props.vertical_align) {
                                                cell_style.verticalAlign=el_props.vertical_align;
                                            }
                                            var percent=widths[j];
                                            if (percent) cell_style.width=""+percent+"%";
                                            cols.push(<td key={j} style={cell_style}>
                                                {(()=>{
                                                    var el=el_props.elements[i][j];
                                                    if (el) {
                                                        return <Element el_props={el} root={this.props.root} context={this.props.context}/>
                                                    }
                                                })()}
                                            </td>);
                                        }
                                        return cols;
                                    })()}
                                </tr>);
                            }
                        }
                        return rows;
                    })()}
                </tbody>
            </table>
        </div>
    }
}

class Field extends React.Component {
    constructor(props) {
        super(props);
        this.state={};
        var el_props=this.props.el_props;
        if (el_props.name) {
            this.props.root.register_component(el_props.name,this);
        }
    }

    render() {
        //console.log("Field.render",this.props);
        var el_props=this.props.el_props;
        if (el_props.dyn_props) {
            var ctx=Object.assign({},this.props.context);
            ctx.page_params=this.props.root.props;
            Object.assign(ctx,ctx.data||{});
            var dyn_props=null;
            try {
                dyn_props=this.props.root.code_eval("("+el_props.dyn_props+")",ctx);
            } catch (err) {
                console.log("Failed to evaluate dyn_props: "+err);
            }
            //console.log("=> dyn_props",dyn_props);
            if (dyn_props) {
                el_props=Object.assign({},el_props,dyn_props);
            }
        }
        if (el_props.hidden) return <div/>;
        var div_style={position:"relative"};
        var style={};
        if (el_props.margin_top!=null) div_style.marginTop=el_props.margin_top;
        if (el_props.margin_right!=null) div_style.marginRight=el_props.margin_right;
        if (el_props.margin_bottom!=null) div_style.marginBottom=el_props.margin_bottom;
        if (el_props.margin_left!=null) div_style.marginLeft=el_props.margin_left;
        if (el_props.align!=null) div_style.textAlign=el_props.align;
        if (el_props.background_color) div_style.backgroundColor=el_props.background_color;
        if (el_props.padding_top!=null) div_style.paddingTop=el_props.padding_top;
        if (el_props.padding_right!=null) div_style.paddingRight=el_props.padding_right;
        if (el_props.padding_bottom!=null) div_style.paddingBottom=el_props.padding_bottom;
        if (el_props.padding_left!=null) div_style.paddingLeft=el_props.padding_left;
		return <div style={div_style}>
			{(()=>{
				var type=el_props.field_type;
				if (!type) return <div>Select field type!</div>;
				if (type=="text") {
					return <FieldText {...this.props} ref="field"/>;
				} else if (type=="textarea") {
					return <FieldTextArea {...this.props} ref="field"/>;
				} else if (type=="number") {
					return <FieldNumber {...this.props} ref="field"/>;
				} else if (type=="password") {
					return <FieldPassword {...this.props} ref="field"/>;
				} else if (type=="email") {
					return <FieldEmail {...this.props} ref="field"/>;
				} else if (type=="phone") {
					return <FieldPhone {...this.props} ref="field"/>;
				} else if (type=="checkbox") {
					return <FieldCheckbox {...this.props} ref="field"/>;
				} else if (type=="radio") {
					return <FieldRadio {...this.props} ref="field"/>;
				} else if (type=="select") {
					return <FieldSelect {...this.props} ref="field"/>;
				} else if (type=="multiselect") {
					return <FieldMultiSelect {...this.props} ref="field"/>;
				} else if (type=="files") {
					return <FieldFiles {...this.props} ref="field"/>;
				} else if (type=="date") {
					return <FieldDate {...this.props} ref="field"/>;
				} else if (type=="location") {
					return <FieldLocation {...this.props} ref="field"/>;
				} else {
					return <div>Invalid field type: {type}</div>;
				}
			})()}
		</div>
    }

    get_value() {
        if (!this.refs.field) throw new Error("Missing field ref");
        if (!this.refs.field.get_value) throw new Error("Missing get_value in field type "+this.props.el_props.field_type);
        return this.refs.field.get_value();
    }

    set_error(err) {
        if (!this.refs.field) throw new Error("Missing field ref");
        if (!this.refs.field.set_error) throw new Error("Missing set_error in field type "+this.props.el_props.field_type);
        return this.refs.field.set_error(err);
    }

    set_props(props) {
        if (!this.refs.field) throw new Error("Missing field ref");
        this.refs.field.set_props(props);
    }

    focus() {
        if (!this.refs.field) throw new Error("Missing field ref");
        this.refs.field.focus();
    }
}

class FieldText extends React.Component {
    constructor(props) {
        super(props);
        var el_props=props.el_props;
		var context=props.context||{};
		var data=context.data;
		if (el_props.name && data[el_props.name]) {
			this.state={value:data[el_props.name]};
		} else { 
            this.state={};
        }
    }

	componentWillReceiveProps(props) {
        var el_props=this.props.el_props;
		var context=this.props.context||{};
		var data=context.data;
		if (el_props.name) {
			var val=data[el_props.name];
			this.setState({value:val});
		} 
	}

    render() {
        var el_props=this.props.el_props;
        var style={};
        if (el_props.width) style.width=conv_size(el_props.width);
        style.borderStyle="solid";
        style.borderWidth=el_props.border_width!=null?el_props.border_width:1;
        style.borderRadius=el_props.border_radius||0;
        if (el_props.border_color) style.borderColor=el_props.border_color;
        if (el_props.border_top_width!=null) style.borderTopWidth=el_props.border_top_width;
        if (el_props.border_right_width!=null) style.borderRightWidth=el_props.border_right_width;
        if (el_props.border_bottom_width!=null) style.borderBottomWidth=el_props.border_bottom_width;
        if (el_props.border_left_width!=null) style.borderLeftWidth=el_props.border_left_width;
        if (el_props.background_color) style.backgroundColor=el_props.background_color;
        var name="text"
        if (el_props.name) { name=el_props.name; }
        return <div>
            <input type="text" name={name} className={classNames("form-control",{"is-invalid":this.state.error!=null})} placeholder={t(el_props.placeholder)} style={style} value={this.state.value||""} onChange={this.on_change.bind(this)} onBlur={this.on_blur.bind(this)} onKeyDown={this.on_key_down.bind(this)} ref={el=>this.input=el}/>
            {(()=>{
                if (!this.state.error) return;
                return <div className="invalid-feedback">
                    {this.state.error}
                </div>
            })()}
        </div>
    }

    on_change(e) {
        var val=e.target.value;
        this.setState({value:val});
        var el_props=this.props.el_props;
        var ctx=this.props.context||{};
        var data=ctx.data;
        if (el_props.name) data[el_props.name]=val;
    }

    get_value() {
        return this.state.value;
    }

    set_error(err) {
        this.setState({error:err});
    }

    on_blur() {
        var el_props=this.props.el_props;
        var val=this.state.value;
        var ctx=this.props.context||{};
        var data=ctx.data;
        if (el_props.name) data[el_props.name]=val;
        var on_change=el_props.on_change;
        if (on_change) {
            this.props.root.code_eval(on_change,this.props.context);
        }
    }

    on_key_down(e) {
        if (e.key == 'Enter') {
            this.on_submit()
        }
    }

    on_submit() {
        var el_props = this.props.el_props
        var on_submit = el_props.on_submit
        if (on_submit) {
            var ctx = this.props.context || {}
            var data = ctx.data
            var val = this.state.value || ''
            if (el_props.name) data[el_props.name] = val
            Object.assign(ctx, ctx.data || {})
            var res=this.props.root.code_eval(on_submit, ctx)
            if (res) {
                res.then(()=>{
                }).catch(err=>{
                    alert(t("Error")+": "+t(err));
                });
            }
        }
    }

    focus() {
        this.input.focus();
    }
}

class FieldTextArea extends React.Component {
    constructor(props) {
        super(props);
        var el_props=props.el_props;
		var context=props.context||{};
		var data=context.data;
		if (el_props.name && data[el_props.name]) {
			this.state={value:data[el_props.name]};
		} else { 
            this.state={};
        }
    }

	componentWillReceiveProps(props) {
        var el_props=this.props.el_props;
		var context=this.props.context||{};
		var data=context.data;
		if (el_props.name) {
			var val=data[el_props.name];
			this.setState({value:val});
		} 
	}

    render() {
        var el_props=this.props.el_props;
        var style={};
        if (el_props.width) style.width=conv_size(el_props.width);
        style.borderStyle="solid";
        style.borderWidth=el_props.border_width!=null?el_props.border_width:1;
        style.borderRadius=el_props.border_radius||0;
        if (el_props.border_color) style.borderColor=el_props.border_color;
        if (el_props.border_top_width!=null) style.borderTopWidth=el_props.border_top_width;
        if (el_props.border_right_width!=null) style.borderRightWidth=el_props.border_right_width;
        if (el_props.border_bottom_width!=null) style.borderBottomWidth=el_props.border_bottom_width;
        if (el_props.border_left_width!=null) style.borderLeftWidth=el_props.border_left_width;
        return <div>
            <textarea className={classNames("form-control",{"is-invalid":this.state.error!=null})} placeholder={t(el_props.placeholder)} style={style} value={this.state.value||""} onChange={this.on_change.bind(this)} onBlur={this.on_blur.bind(this)}/>
            {(()=>{
                if (!this.state.error) return;
                return <div className="invalid-feedback">
                    {this.state.error}
                </div>
            })()}
        </div>
    }

    on_change(e) {
        var val=e.target.value;
        this.setState({value:val});
    }

    get_value() {
        return this.state.value;
    }

    set_error(err) {
        this.setState({error:err});
    }

    on_blur() {
        var el_props=this.props.el_props;
        var val=this.state.value;
        var ctx=this.props.context||{};
        var data=ctx.data;
        if (el_props.name) data[el_props.name]=val;
        var on_change=el_props.on_change;
        if (on_change) {
            this.props.root.code_eval(on_change,this.props.context);
        }
    }
}

class FieldNumber extends React.Component {
    constructor(props) {
        super(props);
        var el_props=props.el_props;
		var context=props.context||{}
		var data=context.data;
		if (el_props.name && data[el_props.name]) {
			this.state={value:data[el_props.name]};
		} else { 
            this.state={};
        }
    }

	componentWillReceiveProps(props) {
        var el_props=this.props.el_props;
		var context=this.props.context||{};
		var data=context.data;
		if (el_props.name) {
			var val=data[el_props.name];
			this.setState({value:val});
		} 
	}

    render() {
        var el_props=this.props.el_props;
        var style={};
        if (el_props.width) style.width=conv_size(el_props.width);
        style.borderStyle="solid";
        style.borderWidth=el_props.border_width!=null?el_props.border_width:1;
        style.borderRadius=el_props.border_radius||0;
        if (el_props.border_color) style.borderColor=el_props.border_color;
        if (el_props.border_top_width!=null) style.borderTopWidth=el_props.border_top_width;
        if (el_props.border_right_width!=null) style.borderRightWidth=el_props.border_right_width;
        if (el_props.border_bottom_width!=null) style.borderBottomWidth=el_props.border_bottom_width;
        if (el_props.border_left_width!=null) style.borderLeftWidth=el_props.border_left_width;
        return <div>
            <input type="number" className={classNames("form-control",{"is-invalid":this.state.error!=null})} placeholder={el_props.placeholder} style={style} value={this.state.value||""} onChange={this.on_change.bind(this)} onBlur={this.on_blur.bind(this)}/>
            {(()=>{
                if (!this.state.error) return;
                return <div className="invalid-feedback">
                    {this.state.error}
                </div>
            })()}
        </div>
    }

    on_change(e) {
        var val=e.target.value;
        var el_props=this.props.el_props;
        if (el_props.min_value) {
            var min=parseFloat(el_props.min_value);
            if (val!=null && val < min) val=""+min;
        }
        if (el_props.max_value) {
            var max=parseFloat(el_props.max_value);
            if (val!=null && val > max) val=""+max;
        }
        console.log("on_change",val);
        this.setState({value:val});

        //KMN: required this on firefox
        var el_props=this.props.el_props;
        var ctx=this.props.context||{};
        var data=ctx.data;
        if (el_props.name) data[el_props.name]=val;
    }

    get_value() {
        return this.state.value;
    }

    set_error(err) {
        this.setState({error:err});
    }

    on_blur() {
        var el_props=this.props.el_props;
        var val=this.state.value;
        var ctx=this.props.context||{};
        var data=ctx.data;
        if (el_props.name) data[el_props.name]=val;
        var on_change=el_props.on_change;
        if (on_change) {
            this.props.root.code_eval(on_change,this.props.context);
        }
    }
}

class FieldCheckbox extends React.Component {
    constructor(props) {
        //console.log("FieldCheckbox.constructor",props);
        super(props);
        var el_props=props.el_props;
        var ctx=props.context||{};
        var data=ctx.data;
        var val=data[el_props.name];
        this.state={value:val};
    }

    componentWillReceiveProps(props) {
        //console.log("FieldCheckbox.componentWillReceiveProps",props);
        var ctx=this.props.context||{};
        var data=ctx.data||{};
        var el_props=props.el_props;
        var val=data[el_props.name];
        if (val!=this.state.value) {
            this.setState({value:val});
        }
    }

    render() {
        var el_props=this.props.el_props;
        var style={};
        if (el_props.scale) style.WebkitTransform="scale("+el_props.scale+")";
        var label=el_props.placeholder;
		  return <div>
              <div className="form-check">
                <label className="form-check-label" style={{fontWeight:400,marginLeft:10}}>
                    <input type="checkbox" className="form-check-input" checked={this.state.value||false} onChange={this.on_change.bind(this)} style={style}/>
                    {label}</label>
              </div>
            {(()=>{
                if (!this.state.error) return;
                return <div className="invalid-feedback">
                    {this.state.error}
                </div>
            })()}
        </div>
    }

    on_change(e) {
        console.log("FieldCheckbox.on_change");
        var val=e.target.checked;
        console.log("val",val);
        this.setState({value:val});
        var ctx=this.props.context||{};
        var data=ctx.data;
        var el_props=this.props.el_props;
        console.log("name",el_props.name);
        console.log("data",data);
        if (el_props.name) data[el_props.name]=val;
        var on_change=el_props.on_change;
        if (on_change) {
            var ctx=Object.assign({},this.props.context);
            Object.assign(ctx,ctx.data||{});
            ctx.checked=e.target.checked;
            this.props.root.code_eval(on_change,ctx);
        }
        this.props.root.forceUpdate();
    }

    get_value() {
        return this.state.value;
    }

    set_error(err) {
        this.setState({error:err});
    }
}

class FieldRadio extends React.Component {
    constructor(props) {
        console.log("FieldRadio.constructor",props);
        super(props);
        var el_props=props.el_props;
        var ctx=props.context||{};
        var data=ctx.data;
        var val=data[el_props.name];
        this.state={value:val};
    }

    componentWillReceiveProps(props) {
        console.log("FieldRadio.componentWillReceiveProps",props);
        var ctx=this.props.context||{};
        var data=ctx.data||{};
        var el_props=props.el_props;
        var val=data[el_props.name];
        if (val!=this.state.value) {
            console.log("FieldRadio change",this.state.value,val)
            this.setState({value:val});
        }
    }

    render() {
        var el_props=this.props.el_props;
        var style={};
        if (el_props.scale) style.WebkitTransform="scale("+el_props.scale+")";
        var label=el_props.placeholder;
		return <div>
            <div className="form-check">
                <label className="form-check-label" style={{fontWeight:400,marginLeft:10}}>
                    <input type="radio" name={el_props.name} value={el_props.field_value} className="form-check-input" checked={this.state.value===el_props.field_value} onChange={this.on_change.bind(this)} style={style}/>
                    {label}</label>
            </div>
            {(()=>{
                if (!this.state.error) return;
                return <div className="invalid-feedback">
                    {this.state.error}
                </div>
            })()}
        </div>
    }

    on_change(e) {
        console.log("FieldRadio.on_change");
        var val=e.target.value;
        this.setState({value:val});
        console.log("FieldRadio val",val);
        var ctx=this.props.context||{};
        var data=ctx.data;
        var el_props=this.props.el_props;
        if (el_props.name) data[el_props.name]=val;
        var on_change=el_props.on_change;
        if (on_change) {
            var ctx=Object.assign({},this.props.context);
            Object.assign(ctx,ctx.data||{});
            ctx.value=e.target.value;
            this.props.root.code_eval(on_change,ctx);
        }
        this.props.root.forceUpdate(); // get across to other radios
    }

    get_value() {
        return this.state.value;
    }

    set_error(err) {
        this.setState({error:err});
    }
}

class FieldPassword extends React.Component {
    constructor(props) {
        super(props);
        this.state={};
    }

    render() {
        var el_props=this.props.el_props;
        var style={};
        style.borderStyle="solid";
        style.borderWidth=el_props.border_width!=null?el_props.border_width:1;
        style.borderRadius=el_props.border_radius||0;
        if (el_props.border_color) style.borderColor=el_props.border_color;
        if (el_props.border_top_width!=null) style.borderTopWidth=el_props.border_top_width;
        if (el_props.border_right_width!=null) style.borderRightWidth=el_props.border_right_width;
        if (el_props.border_bottom_width!=null) style.borderBottomWidth=el_props.border_bottom_width;
        if (el_props.border_left_width!=null) style.borderLeftWidth=el_props.border_left_width;
        var name="password"
        if (el_props.name) { name=el_props.name; }
        return <div>
            <input type="password" name={name} className={classNames("form-control",{"is-invalid":this.state.error!=null})} placeholder={t(el_props.placeholder)} style={style} value={this.state.value||""} onChange={this.on_change.bind(this)} onBlur={this.on_blur.bind(this)} onKeyDown={this.on_key_down.bind(this)}/>
            {(()=>{
                if (!this.state.error) return;
                return <div className="invalid-feedback">
                    {this.state.error}
                </div>
            })()}
        </div>
    }

    on_change(e) {
        var val=e.target.value;
        this.setState({value:val});
    }

    get_value() {
        return this.state.value;
    }

    set_error(err) {
        this.setState({error:err});
    }

    on_blur() {
        var el_props=this.props.el_props;
        var val=this.state.value;
        var ctx=this.props.context||{};
        var data=ctx.data;
        if (el_props.name) data[el_props.name]=val;
        var on_change=el_props.on_change;
        if (on_change) {
            this.props.root.code_eval(on_change,this.props.context);
        }
    }

    on_key_down(e) {
        if (e.key == 'Enter') {
            this.on_submit()
        }
    }

    on_submit() {
        var el_props = this.props.el_props
        var on_submit = el_props.on_submit
        if (on_submit) {
            var ctx = this.props.context || {}
            var data = ctx.data
            var val = this.state.value || ''
            if (el_props.name) data[el_props.name] = val
            Object.assign(ctx, ctx.data || {})
            var res=this.props.root.code_eval(on_submit, ctx)
            if (res) {
                res.then(()=>{
                }).catch(err=>{
                    alert(t("Error")+": "+t(err));
                });
            }
        }
    }
}

class FieldEmail extends React.Component {
    constructor(props) {
        super(props);
        this.state={};
    }

	componentWillReceiveProps(props) {
        var el_props=this.props.el_props;
		var context=this.props.context;
		var data=context.data;
		if (el_props.name) {
			var val=data[el_props.name];
			this.setState({value:val});
		} 
	}

    render() {
        var el_props=this.props.el_props;
        var style={};
        style.borderStyle="solid";
        style.borderWidth=el_props.border_width!=null?el_props.border_width:1;
        style.borderRadius=el_props.border_radius||0;
        if (el_props.border_color) style.borderColor=el_props.border_color;
        if (el_props.border_top_width!=null) style.borderTopWidth=el_props.border_top_width;
        if (el_props.border_right_width!=null) style.borderRightWidth=el_props.border_right_width;
        if (el_props.border_bottom_width!=null) style.borderBottomWidth=el_props.border_bottom_width;
        if (el_props.border_left_width!=null) style.borderLeftWidth=el_props.border_left_width;
        var name="email"
        if (el_props.name) { name=el_props.name; }
        return <div>
            <input type="email" name={name} className={classNames("form-control",{"is-invalid":this.state.error!=null})} placeholder={t(el_props.placeholder)} style={style} value={this.state.value||""} onChange={this.on_change.bind(this)} onBlur={this.on_blur.bind(this)} onKeyDown={this.on_key_down.bind(this)}/>
            {(()=>{
                if (!this.state.error) return;
                return <div className="invalid-feedback">
                    {this.state.error}
                </div>
            })()}
        </div>
    }

    on_change(e) {
        var val=e.target.value;
        this.setState({value:val});
        var el_props=this.props.el_props;
        var ctx=this.props.context||{};
        var data=ctx.data;
        if (el_props.name) data[el_props.name]=val;
    }

    get_value() {
        return this.state.value;
    }

    set_error(err) {
        this.setState({error:err});
    }

    on_blur() {
        var el_props=this.props.el_props;
        var val=this.state.value;
        var ctx=this.props.context||{};
        var data=ctx.data;
        if (el_props.name) data[el_props.name]=val;
        var on_change=el_props.on_change;
        if (on_change) {
            this.props.root.code_eval(on_change,this.props.context);
        }
    }

    on_key_down(e) {
        if (e.key == 'Enter') {
            this.on_submit()
        }
    }

    on_submit() {
        var el_props = this.props.el_props
        var on_submit = el_props.on_submit
        if (on_submit) {
            var ctx = this.props.context || {}
            var data = ctx.data
            var val = this.state.value || ''
            if (el_props.name) data[el_props.name] = val
            Object.assign(ctx, ctx.data || {})
            var res=this.props.root.code_eval(on_submit, ctx)
            if (res) {
                res.then(()=>{
                }).catch(err=>{
                    alert(t("Error")+": "+t(err));
                });
            }
        }
    }
}

class FieldPhone extends React.Component {
    constructor(props) {
        super(props);
        this.state={};
    }

	componentWillReceiveProps(props) {
        var el_props=this.props.el_props;
		var context=this.props.context;
		var data=context.data;
		if (el_props.name) {
			var val=data[el_props.name];
			this.setState({value:val});
		} 
	}

    render() {
        var el_props=this.props.el_props;
        var style={};
        style.borderStyle="solid";
        style.borderWidth=el_props.border_width!=null?el_props.border_width:1;
        style.borderRadius=el_props.border_radius||0;
        if (el_props.border_color) style.borderColor=el_props.border_color;
        if (el_props.border_top_width!=null) style.borderTopWidth=el_props.border_top_width;
        if (el_props.border_right_width!=null) style.borderRightWidth=el_props.border_right_width;
        if (el_props.border_bottom_width!=null) style.borderBottomWidth=el_props.border_bottom_width;
        if (el_props.border_left_width!=null) style.borderLeftWidth=el_props.border_left_width;
        return <div>
            <input type="phone" className={classNames("form-control",{"is-invalid":this.state.error!=null})} placeholder={t(el_props.placeholder)} style={style} value={this.state.value||""} onChange={this.on_change.bind(this)} onBlur={this.on_blur.bind(this)} onKeyDown={this.on_key_down.bind(this)}/>
            {(()=>{
                if (!this.state.error) return;
                return <div className="invalid-feedback">
                    {this.state.error}
                </div>
            })()}
        </div>
    }

    on_change(e) {
        var val=e.target.value;
        this.setState({value:val});
    }

    get_value() {
        return this.state.value;
    }

    set_error(err) {
        this.setState({error:err});
    }

    on_blur() {
        var el_props=this.props.el_props;
        var val=this.state.value;
        var ctx=this.props.context||{};
        var data=ctx.data;
        if (el_props.name) data[el_props.name]=val;
        var on_change=el_props.on_change;
        if (on_change) {
            this.props.root.code_eval(on_change,this.props.context);
        }
    }

    on_key_down(e) {
        if (e.key == 'Enter') {
            this.on_submit()
        }
    }

    on_submit() {
        var el_props = this.props.el_props
        var on_submit = el_props.on_submit
        if (on_submit) {
            var ctx = this.props.context || {}
            var data = ctx.data
            var val = this.state.value || ''
            if (el_props.name) data[el_props.name] = val
            Object.assign(ctx, ctx.data || {})
            var res=this.props.root.code_eval(on_submit, ctx)
            if (res) {
                res.then(()=>{
                }).catch(err=>{
                    alert(t("Error")+": "+t(err));
                });
            }
        }
    }
}

class FieldSelect extends React.Component {
    constructor(props) {
        console.log("FieldSelect.constructor",props.el_props.name);
        super(props);
        var el_props=props.el_props;
        this.state={el_props:el_props};
        if (el_props.selection) {
            this.static_options=el_props.selection.map(o=>{return {label:t(o[1]),value:""+o[0]}});
            console.log("static_options",el_props.name,this.static_options);
        }
    }

    componentDidMount() {
        console.log("FieldSelect.componentDidMount");
        var el_props=this.state.el_props;
        console.log("el_props",el_props);
        var ctx=this.props.context||{};
        var data=ctx.data;
        if (el_props.name) {
            var val=data[el_props.name];
            this.set_value(val);
        }
		this._mounted=true;
    }

    componentWillReceiveProps(props) {
        console.log("FieldSelect.componentWillReceiveProps");
        var ctx=props.context||{};
        var data=ctx.data||{};
        console.log("data",data);
        var el_props=props.el_props;
        var val=data[el_props.name];
        console.log("val",val);
        this.set_value(val);
    }

    async load_options(query,cb) {
        console.log("FieldSelect.load_options",query);
        if (!query) query="";
        var el_props=this.state.el_props;
        if (el_props.load_options) {
            var ctx=Object.assign({},this.props.context);
            Object.assign(ctx,ctx.data||{});
            ctx.query=query;
            try {
                var promise=this.props.root.code_eval(el_props.load_options,ctx);
            } catch (err) {
                console.error(err);
            }
            console.log("=> FieldSelect promise",promise);
            return promise;
        }
        var cond=[];
        if (el_props.condition) {
            try {
                var ctx=Object.assign({},this.props.context);
                Object.assign(ctx,ctx.data||{});
                cond=this.props.root.code_eval("("+el_props.condition+")",ctx);
            } catch (err) {
                cond=JSON.parse(el_props.condition);
            }
        }
        var method=el_props.search_method||"name_search";
        var data=await rpc.execute(el_props.model,method,[query],{condition:cond,limit:100});
        var options=data.map(o=>{return {label:t(o[1]),value:o[0]}});
        console.log("=> options",options);
        return options;
    }

    async load_names(ids,cb) {
        console.log("FieldSelect.load_names",ids);
        if (!query) query="";
        var el_props=this.state.el_props;
        if (el_props.load_names) {
            var ctx=Object.assign({},this.props.context);
            Object.assign(ctx,ctx.data||{});
            ctx.ids=ids;
            try {
                var promise=this.props.root.code_eval(el_props.load_names,ctx);
            } catch (err) {
                console.error(err);
            }
            console.log("=> FieldSelect promise",promise);
            return promise;
        }
        var method="name_get";
        var data=await rpc.execute(el_props.model,method,[ids],{});
        var options=data.map(o=>{return {label:t(o[1]),value:o[0]}});
        console.log("=> options",options);
        return options;
    }

    render() {
        console.log("FieldSelect.render",this.state.el_props.name,this.state.selected_option,this.state);
        if (!this._mounted) return <div/>;
        var el_props=this.state.el_props;
        var style={};
        if (this.state.error) style.borderColor="red";
        var div_style={};
        div_style.color="#333";
        if (el_props.width) div_style.width=parseInt(el_props.width);
        var disabled=el_props.disabled||false;
        var styles={
            /*control: base=>Object.assign({},base,{height:30,minHeight:30,backgroundColor:el_props.background_color,borderColor:el_props.border_color}),
            singleValue: base=>Object.assign({},base,{color:el_props.color}),
            input: base=>Object.assign({},base,{color:el_props.color,margin:0}),
            dropdownIndicator: base=>Object.assign({},base,{padding:4}),
            menuPortal: base => ({ ...base, zIndex: 9999}),
            menu: base => ({ ...base, backgroundColor:"#222"}),
            menuList: base => ({ ...base, backgroundColor:"#222"}),
            clearIndicator: base => ({ ...base, padding:0, marginRight:2}),
            option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected ? "#999" : "#222",
                ':active': {
                  backgroundColor: state.isSelected ? "#999" : "#666",
                },
                ':hover': {
                  backgroundColor: state.isSelected ? "#999" : "#666",
                },
            }),*/
        };
        //console.log("FieldSelect styles",styles);
        return <div style={div_style}>
            {(()=>{
                if (this.static_options) {
                    console.log("Select",el_props.name,"value",this.state.selected_option,"options",this.static_options);
                    return <Select options={this.static_options} onChange={this.on_change.bind(this)} placeholder={t(el_props.placeholder)} value={this.state.selected_option} isClearable={true} style={style} isDisabled={disabled} styles={styles} menuPortalTarget={document.body}/>
                }
                return <AsyncSelect loadOptions={this.load_options.bind(this)} onChange={this.on_change.bind(this)} placeholder={t(el_props.placeholder)} value={this.state.selected_option} isClearable={true} style={style} onMenuOpen={this.on_menu_open.bind(this)} ref="select" isDisabled={disabled} styles={styles} menuPortalTarget={document.body}/>
            })()}
            {(()=>{
                if (!this.state.error) return;
                return <div className="invalid-feedback" style={{display:"block"}}>
                    {this.state.error}
                </div>
            })()}
        </div>
    }

    on_menu_open() {
        console.log("on_menu_open");
        var comp=this.refs.select;
        window.xxx_comp=comp;
        if (!comp.state.inputValue) {
            comp.handleInputChange("%"); // XXX
        }
    }

    on_change(obj) {
        console.log("FieldSelect.on_change",this.state.el_props.name,obj);
        var el_props=this.state.el_props;
        var val=obj?obj.value:null;
        //alert("x"+val);
        var ctx=this.props.context||{};
        var data=ctx.data;
        if (el_props.name) data[el_props.name]=val;
        this.setState({selected_option:obj},()=>{
            var method=el_props.onchange_method;
            if (method) {
                this.props.root.run_method(method);
            }
            var on_change=el_props.on_change;
            if (on_change) {
                var ctx=Object.assign({},this.props.context);
                Object.assign(ctx,ctx.data||{});
                this.props.root.code_eval(on_change,ctx);
            } else {
                this.props.root.set_data({}); // XXX
            }
        });
    }

    get_value() {
        if (!this.state.selected_option) return null;
        return this.state.selected_option.value;
    }

    async set_value(val_id) {
        console.log("FieldSelect.set_value",this.state.el_props.name,val_id);
		if (_.isObject(val_id) && val_id.id) {
			val_id=val_id.id;
		}
        var el_props=this.state.el_props;
        var ctx=this.props.context||{};
        var data=ctx.data;
		if (el_props.name) data[el_props.name]=val_id;
        if (!val_id) {
            this.setState({selected_option:null});
            return;
        }
        if (el_props.selection) {
            var opt=_.find(this.static_options,o=>o.value==""+val_id);
            console.log("selected option2",el_props.name,opt,val_id,this.static_options,el_props.selection);
            /*
            if (res) {
                var name=res[1];
            } else {
                var name="N/A";
            }
            console.log("=> selected option",{value:val_id,label:name});
            this.setState({selected_option:{value:val_id,label:name}})*/;
            this.setState({selected_option:opt});
        } else {
            if (!this.state.selected_option || this.state.selected_option.value!=val_id) {
                var res=await this.load_names([val_id]);
                var option=res[0];
                this.setState({selected_option:option});
            }
        }
    }

    set_error(err) {
        this.setState({error:err});
    }

    set_props(props) {
        console.log("FieldSelect.set_props",props);
        Object.assign(this.state.el_props,props);
        this.forceUpdate();
    }
}

class FieldMultiSelect extends React.Component {
    constructor(props) {
        super(props);
        this.state={};
    }

    componentDidMount() {
		//console.log("FieldSelect.componentDidMount");
        var el_props=this.props.el_props;
		//console.log("el_props",el_props);
        if (el_props.selection) {
            this.setState({selection:el_props.selection});
        } else if (el_props.model) {
            var q="";
            rpc.execute(el_props.model,"name_search",[q],{}).then(data=>{
                this.setState({selection:data});
            });
        }
    }

    render() {
        var el_props=this.props.el_props;
        var selection=this.state.selection||[];
        var options=selection.map(o=>{return {label:o[1],value:o[0]}});
		var style={};
		if (this.state.error) style.borderColor="red";
        return <div>
            <Select options={options} onChange={this.on_change.bind(this)} placeholder={t(el_props.placeholder)} multi={true} value={this.state.value||[]} clearable={false} style={style}/>
            {(()=>{
                if (!this.state.error) return;
                return <div className="invalid-feedback" style={{display:"block"}}>
                    {this.state.error}
                </div>
            })()}
        </div>
    }

    on_change(values) {
        var ids=values.map(o=>o.value);
        this.setState({value:ids});
    }

    get_value() {
        return this.state.value;
    }

    set_error(err) {
        this.setState({error:err});
    }
}

class FieldFiles extends React.Component {
    constructor(props) {
        super(props);
        this.state={};
    }

    render() {
        var files=this.state.files||[];
        var uploads=this.state.uploads||[];
        return <div>
            {files.map((fname,i)=>{
                var url=rpc.get_file_uri(fname);
                var file_str=rpc.get_file_name(fname);
                return <div key={i} style={{marginBottom:5}}>
                    <a href="#" onClick={this.del_file.bind(this,i)} style={{color:"#666",float:"right"}}><i className="fa fa-trash"/></a>
                    <a href={url}>{file_str}</a>
                </div>
            })}
            {uploads.map((obj,i)=>{
                return <div key={i}>
                    <div>{obj.fname}</div>
                    <div className="progress">
                      <div className="progress-bar progress-bar-striped active" style={{width:""+obj.percent+"%"}}>
                        {obj.percent}%
                      </div>
                    </div>
                </div>
            })}
            <Dropzone ref="dropzone" onDrop={this.on_drop.bind(this)} style={{backgroundColor:"#eee",border:"1px dashed #ccc",borderRadius:5,textAlign:"center",padding:20}} disableClick="1">
                <i className="fa fa-cloud-download" style={{color:"#666",fontSize:30}}/>
                <p style={{color:"#666",textAlign:"center"}}>Drag and drop files here.</p>
                <button className="btn btn-sm btn-default" onClick={e => {e.preventDefault();this.refs.dropzone.open()}}>{t("Select files to upload")}</button>
            </Dropzone>
        </div>
    }

    on_drop(accepted_files, rejected_files) {
        //console.log("onDrop",accepted_files,rejected_files);
        accepted_files.forEach(f=>{
            var upload={
                fname: f.name,
                progress: 0,
            };
			if (!this.state.uploads) this.state.uploads=[];
            this.state.uploads.push(upload);
            this.forceUpdate();
            rpc.upload_file(f,this.file_uploaded.bind(this,upload),this.file_progress.bind(this,upload));
        });
    }

    file_uploaded(upload,err,fname) {
        //console.log("file_uploaded",upload,err,fname);
        if (err) {
            console.error(t("Error")+": "+t(err));
            return;
        }
        var i=this.state.uploads.find(o=>o==upload);
        if (i==-1) throw new Error("Upload not found");
        this.state.uploads.splice(i,1);
        var files=this.state.files||[];
        files.push(fname);
        this.setState({files:files});
    }

    file_progress(upload,loaded,total)  {
        //console.log("file_progress",upload,loaded,total);
        upload.percent=Math.floor(loaded*100/total);
        this.forceUpdate();
    }

    del_file(i,e) {
        //console.log("del_file",i);
        e.preventDefault();
        var files=this.state.files||[];
        files.splice(i,1);
        this.setState({files:files});
    }

    get_value() {
        return this.state.files||[];
    }

    set_error(err) {
        this.setState({error:err});
    }
}

class FieldDate extends React.Component {
    constructor(props) {
        super(props);
        this.state={};
        var el_props=props.el_props;
		var context=props.context||{};
		var data=context.data;
        var date=new Date();
		if (el_props.name && data[el_props.name]) {
            var day=moment(data[el_props.name])
            if (day.isValid()) {
                date=day.toDate();
            }
		}
	    this.state={value:date};
    }

	componentWillReceiveProps(props) {
        var el_props=this.props.el_props;
		var context=this.props.context;
		var data=context.data;
		if (el_props.name && data[el_props.name]) {
            var day=moment(data[el_props.name])
            if (day.isValid()) {
                var date=day.toDate();
			    this.setState({value:date});
            }
		}
	}

    render() {
        var el_props=this.props.el_props;
        var style={};
        if (i18n.get_active_lang() === "th_TH")
        {
            return <div>
                <DatePicker
                    dateFormat="dd/MM/yyyy"
                    selected={this.state.value}
                    locale="th"
                    onChange={this.on_change.bind(this)}
                    placeholderText={el_props.placeholder}
                    peekNextMonth
                    showMonthDropdown
                    showYearDropdown
                />
            </div>;
        }
        else
        {
            return <div>
                <DatePicker
                    dateFormat="dd/MM/yyyy"
                    selected={this.state.value}
                    onChange={this.on_change.bind(this)}
                    placeholderText={el_props.placeholder}
                    peekNextMonth
                    showMonthDropdown
                    showYearDropdown
                />
            </div>;
        }
    }

    on_change(d) {
        this.setState({value:d});
        var val=moment(d).format("YYYY-MM-DD");
        var el_props=this.props.el_props;
        var ctx=this.props.context||{};
        var data=ctx.data;
        if (el_props.name) data[el_props.name]=val;
        var on_change=el_props.on_change;
        if (on_change) {
            this.props.root.code_eval(on_change,this.props.context);
        }
    }

    get_value() {
        var val=moment(this.state.value).format("YYYY-MM-DD");
        return val;
    }

    set_error(err) {
        this.setState({error:err});
    }

    on_blur() {
        var el_props=this.props.el_props;
        var val=moment(this.state.value).format("YYYY-MM-DD");
        var ctx=this.props.context||{};
        var data=ctx.data;
        if (el_props.name) data[el_props.name]=val;
        var on_change=el_props.on_change;
        if (on_change) {
            this.props.root.code_eval(on_change,this.props.context);
        }
    }
}

class FieldLocation extends React.Component {
    constructor(props) {
        super(props);
        this.state={};
    }

    render() {
        var el_props=this.props.el_props;
        var style={};
        if (el_props.width!=null) style.width=el_props.width;
        return <input ref={this.init_input.bind(this)} type="text" placeholder={el_props.placeholder} className="xxx-location" style={style}/>;
    }

    init_input(el) {
        console.log("FieldLocation.init_input",el);
        this.input=el;
        setTimeout(()=>{
            //console.log("xxx");
            this.autocomplete = new google.maps.places.Autocomplete(this.input);
            this.autocomplete.setComponentRestrictions({'country': ["my","sg"]});
            this.autocomplete.addListener('place_changed',this.place_changed.bind(this));
        },1000);
    }

    place_changed() {
        console.log("FieldLocation.place_changed");
        var place = this.autocomplete.getPlace();
        console.log("=> place",place);
        var comps=place.address_components;
        //console.log("comps",comps);
        var name=place.name;
        var lat=place.geometry.location.lat();
        var lng=place.geometry.location.lng();
        var coords=""+lat+","+lng;
        var district=null;
        var province=null;
        var country=null;
        comps.forEach(o=>{
            if (_.includes(o.types,"administrative_area_level_1")) province=o.short_name;
            if (_.includes(o.types,"locality")) district=o.short_name;
            if (_.includes(o.types,"country")) country=o.long_name;
        });
        var val={name:name,coords:coords,country:country,province:province,district:district};
        this.setState({value:val});

        var el_props=this.props.el_props;
        var ctx=this.props.context||{};
        var data=ctx.data;
        if (el_props.name) data[el_props.name]=val;
        var on_change=el_props.on_change;
        if (on_change) {
            this.props.root.code_eval(on_change,this.props.context);
        }
    }
}

class Nav extends React.Component {
    constructor(props) {
        super(props);
        this.state={active_item:0};
    }

    render() {
        //console.log("Nav.render",this.props);
        var el_props=this.props.el_props;
        var div_style={position:"relative"};
        var style={};
        if (el_props.width!=null) style.width=el_props.width;
        if (el_props.height!=null) style.height=el_props.height;
        if (el_props.margin_top!=null) div_style.marginTop=el_props.margin_top;
        if (el_props.margin_right!=null) div_style.marginRight=el_props.margin_right;
        if (el_props.margin_bottom!=null) div_style.marginBottom=el_props.margin_bottom;
        if (el_props.margin_left!=null) div_style.marginLeft=el_props.margin_left;
        if (el_props.align!=null) div_style.textAlign=el_props.align;
        if (el_props.background_color) div_style.backgroundColor=el_props.background_color;
        if (el_props.padding_top!=null) div_style.paddingTop=el_props.padding_top;
        if (el_props.padding_right!=null) div_style.paddingRight=el_props.padding_right;
        if (el_props.padding_bottom!=null) div_style.paddingBottom=el_props.padding_bottom;
        if (el_props.padding_left!=null) div_style.paddingLeft=el_props.padding_left;
        var items=el_props.nav_items||[];
        return <div style={div_style}>
            {(()=>{
                return <div>
                    <ul className={classNames("nav",{"nav-tabs":el_props.nav_mode=="tabs","nav-pills":el_props.nav_mode=="pills","flex-column":el_props.nav_dir=="vertical","justify-content-center":el_props.nav_align=="center","justify-content-end":el_props.nav_align=="right","nav-fill":el_props.nav_width=="fill","nav-justified":el_props.nav_width=="justified"})}>
                        {items.map((item,i)=>{
                            return <li className="nav-item"><a href="#" className={classNames("nav-link",{active:this.state.active_item==i})}>{item.label||"N/A"}</a></li>
                        })}
                    </ul>
                    {(()=>{
                        if (!el_props.elements) el_props.elements=[];
                        if (!el_props.elements[this.state.active_item]) {
                            el_props.elements[this.state.active_item]=[];
                        }
                        var els=el_props.elements[this.state.active_item];
                        return <ElementList elements={els} root={this.props.root} context={this.props.context}/>
                    })()}
                </div>;
            })()}
        </div>
    }
}

class Slider extends React.Component {
    constructor(props) {
        super(props);
        this.state={};
    }

    componentDidMount() {
        this.setState({mounted:true});
    }

    render() {
        //console.log("Slider.render",this.props);
        var el_props=this.props.el_props;
        var div_style={position:"relative"};
        var style={};
        if (el_props.width!=null) style.width=el_props.width;
        if (el_props.height!=null) style.height=el_props.height;
        if (el_props.margin_top!=null) div_style.marginTop=el_props.margin_top;
        if (el_props.margin_right!=null) div_style.marginRight=el_props.margin_right;
        if (el_props.margin_bottom!=null) div_style.marginBottom=el_props.margin_bottom;
        if (el_props.margin_left!=null) div_style.marginLeft=el_props.margin_left;
        if (el_props.align!=null) div_style.textAlign=el_props.align;
        if (el_props.background_color) div_style.backgroundColor=el_props.background_color;
        if (el_props.padding_top!=null) div_style.paddingTop=el_props.padding_top;
        if (el_props.padding_right!=null) div_style.paddingRight=el_props.padding_right;
        if (el_props.padding_bottom!=null) div_style.paddingBottom=el_props.padding_bottom;
        if (el_props.padding_left!=null) div_style.paddingLeft=el_props.padding_left;
		const responsive = {
		  all: {
			breakpoint: { max: 5000, min: 0 },
			items: 1,
		  },
		};
        return <div style={div_style} ref={this.init_slider.bind(this)}>
            {(()=>{
                //if (!this.state.mounted) return;
                //if (!Carousel) return; // XXX
				if (!this.state.width) return;
				return <div style={{width:this.state.width}}>
					<Carousel responsive={responsive} showDots={true} ssr={!this.state.mounted} autoPlay={el_props.loop||false} autoPlaySpeed={el_props.interval||1000} infinite={true}>
						{(()=>{
							if (!el_props.elements) el_props.elements=[];
							var comps=[];
							var num_slides=el_props.num_slides||3;
							for (var i=0; i < num_slides; i++) {
								if (!el_props.elements[i]) el_props.elements[i]=[];
								var els=el_props.elements[i];
								comps.push(<div key={i.toString()}>
									<ElementList elements={els} root={this.props.root} depth={this.props.depth+1} context={this.props.context}/>
								</div>);
							}
							return comps;
						})()}
					</Carousel>
				</div>;
            })()}
        </div>
    }

	init_slider(el) {
		console.log("init_slider");
		if (!el) return;
		if (this.div_el) return;
		this.div_el=el;
		window.xxx_el=el;
		var w=el.offsetWidth;
		console.log("width",w);
		this.setState({width:w});
	}
}

class Block extends React.Component {
    constructor(props) {
        super(props);
        this.state={};
    }

    render() {
        //console.log("Block.render",this.props);
        var style={};
        var el_props=this.props.el_props;
        if (el_props.min_height) style.minHeight=el_props.min_height;
        if (el_props.height) style.height=el_props.height;
        if (el_props.background_color) style.backgroundColor=el_props.background_color;
        if (el_props.background_image) {
            //var url=rpc.get_file_uri(el_props.background_image);
            var url=el_props.background_image;
            style.backgroundImage="url("+url+")";
        }
        if (el_props.background_repeat) {
            style.backgroundRepeat=el_props.background_repeat;
        }
        if (el_props.background_image_align) {
            style.backgroundPosition=el_props.background_image_align;
        }
        if (el_props.background_image_size) {
            style.backgroundSize=el_props.background_image_size;
        }
        if (el_props.parallax) {
            style.backgroundAttachment="fixed";
        }
        style.borderStyle="solid";
        style.borderWidth=el_props.border_width||0;
        style.borderRadius=el_props.border_radius||0;
        if (el_props.border_color) style.borderColor=el_props.border_color;
        if (el_props.border_top_width!=null) style.borderTopWidth=el_props.border_top_width;
        if (el_props.border_right_width!=null) style.borderRightWidth=el_props.border_right_width;
        if (el_props.border_bottom_width!=null) style.borderBottomWidth=el_props.border_bottom_width;
        if (el_props.border_left_width!=null) style.borderLeftWidth=el_props.border_left_width;
        if (el_props.margin_top!=null) style.marginTop=el_props.margin_top;
        if (el_props.margin_right!=null) style.marginRight=el_props.margin_right;
        if (el_props.margin_bottom!=null) style.marginBottom=el_props.margin_bottom;
        if (el_props.margin_left!=null) style.marginLeft=el_props.margin_left;
        if (el_props.padding_top!=null) style.paddingTop=el_props.padding_top;
        if (el_props.padding_right!=null) style.paddingRight=el_props.padding_right;
        if (el_props.padding_bottom!=null) style.paddingBottom=el_props.padding_bottom;
        if (el_props.padding_left!=null) style.paddingLeft=el_props.padding_left;
		var block_params={};
        if (el_props.block_params) {
            //console.log("eval block_params",el_props.block_params);
            var ctx=Object.assign({},this.props.context);
            Object.assign(ctx,ctx.data||{});
            try {
                var ctx=Object.assign({},this.props.context);
                Object.assign(ctx,ctx.data||{});;
                ctx.page_params=this.props.root.props;
                block_params=this.props.root.code_eval("("+el_props.block_params+")",ctx);
                console.log("=> block_params",block_params);
            } catch (err) {
                console.log("Failed to evaluate block_params",el_props.block_params,err);
            }
        }
        return <div style={style}>
            {(()=>{
                if (!el_props.block_name) return <div>Enter block name!</div>;
                return <Page page={el_props.block_name} parent_page={this} context={this.props.context} root={this.props.root} container={this.props.root.props.container} {...block_params}/>;
            })()}
        </div>
    }
}

class Overlay extends React.Component {
    constructor(props) {
        super(props);
        this.check_click_outside_bind=this.check_click_outside.bind(this);
    }

    componentDidMount() {
        var el_props=this.props.el_props;
		if (el_props.on_click_outside) {
        	document.body.addEventListener('click', this.check_click_outside_bind);
			this.click_outside_registered=true;
		}
    }

    componentWillUnmount() {
		if (this.click_outside_registered) {
			document.body.removeEventListener('click', this.check_click_outside_bind);
		}
	}

	check_click_outside(e) {
		console.log("check_click_outside",this,e);
        var node=ReactDOM.findDOMNode(this);
        if (node.contains(e.target)) {
            console.log("inside",node,e.target);
            return;
        }
        console.log("outside",node,e.target);
        var el_props=this.props.el_props;
		if (el_props.on_click_outside) {
            var ctx=Object.assign({},this.props.context);
            Object.assign(ctx,ctx.data||{})
            var res=this.props.root.code_eval(el_props.on_click_outside,ctx);
            if (res) {
                res.then(()=>{
                    console.log("click outside handler finished");
                }).catch(err=>{
                    console.error(err);
                });
            }
        }
	}

    render() {
        var style={};
        var el_props=this.props.el_props;
        if (el_props.dyn_props) {
            var ctx=Object.assign({},this.props.context);
            ctx.page_params=this.props.root.props;
            Object.assign(ctx,ctx.data||{});
            var dyn_props=null;
            try {
                dyn_props=this.props.root.code_eval("("+el_props.dyn_props+")",ctx);
            } catch (err) {
                console.log("Failed to evaluate dyn_props: "+err);
            }
            //console.log("=> dyn_props",dyn_props);
            if (dyn_props) {
                el_props=Object.assign({},el_props,dyn_props);
            }
        }
        if (el_props.hidden) return <p style={{display:"none"}}>Hidden</p>;
        if (el_props.min_height) style.minHeight=el_props.min_height;
        if (el_props.height) style.height=el_props.height;
        if (el_props.background_color) style.backgroundColor=el_props.background_color;
        if (el_props.background_image) {
            var url=el_props.background_image;
            style.backgroundImage="url("+url+")";
            style.backgroundRepeat="no-repeat";
        }
        if (el_props.background_image_align) {
            style.backgroundPosition=el_props.background_image_align;
        }
        if (el_props.background_image_size) {
            style.backgroundSize=el_props.background_image_size;
        }
        if (el_props.parallax) {
            style.backgroundAttachment="fixed";
        }
        style.borderStyle="solid";
        style.borderWidth=el_props.border_width||0;
        style.borderRadius=el_props.border_radius||0;
        if (el_props.border_color) style.borderColor=el_props.border_color;
        if (el_props.border_top_width!=null) style.borderTopWidth=el_props.border_top_width;
        if (el_props.border_right_width!=null) style.borderRightWidth=el_props.border_right_width;
        if (el_props.border_bottom_width!=null) style.borderBottomWidth=el_props.border_bottom_width;
        if (el_props.border_left_width!=null) style.borderLeftWidth=el_props.border_left_width;
        if (el_props.margin_top!=null) style.marginTop=el_props.margin_top;
        if (el_props.margin_right!=null) style.marginRight=el_props.margin_right;
        if (el_props.margin_bottom!=null) style.marginBottom=el_props.margin_bottom;
        if (el_props.margin_left!=null) style.marginLeft=el_props.margin_left;
        if (el_props.padding_top!=null) style.paddingTop=el_props.padding_top;
        if (el_props.padding_right!=null) style.paddingRight=el_props.padding_right;
        if (el_props.padding_bottom!=null) style.paddingBottom=el_props.padding_bottom;
        if (el_props.padding_left!=null) style.paddingLeft=el_props.padding_left;
        if (el_props.page_break_after) style.pageBreakAfter="always";
        style.position="absolute";
        if (el_props.left) style.left=parseInt(el_props.left);
        if (el_props.top) style.top=parseInt(el_props.top);
		if (el_props.width) style.width=conv_size(el_props.width);
        if (el_props.height) style.height=conv_size(el_props.height);
		if (el_props.zindex) style.zIndex=el_props.zindex;
        return <div style={style}>
            {(()=>{
                return <ElementList elements={el_props.children} root={this.props.root} context={this.props.context}/>
            })()}
        </div>
    }
}

class Map extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
    }

    componentWillUnmount() {
	}

    render() {
        var el_props=this.props.el_props;
        var style={};
		//style.height="100%";
        if (el_props.width) style.width=conv_size(el_props.width);
        if (el_props.height) style.height=conv_size(el_props.height);
        return <div style={style} ref={this.init_map.bind(this)}/>;
    }

    init_map(el) {
        console.log("Map.init_map",el);
        var el_props=this.props.el_props;
        if (!el) return;
		//if (this.map) return;
        var context=this.props.context||{};
        var data=context.data||{};
        if (el_props.value) {
            var val=JSON.parse(el_props.value);
        } else {
            var val=get_path_value(data,el_props.name)||{};
        }
        console.log("map val",val);
        var markers=val.markers||[];
        for (var o of markers) {
            var res=o.coords.split(",");
            o.pos={
                lat: parseFloat(res[0]),
                lng: parseFloat(res[1]),
            };
        }
        if (markers.length==1) {
            var center=markers[0].pos;
        } else {
            var center={lat: 3.1412, lng: 101.6853};
        }
        console.log("center",center);
        var opts={
            //center: {lat: 13.7563, lng: 100.6018},
            center: center,
            zoom: 12,
        };
        this.map = new google.maps.Map(el,opts);
        for (var o of markers) {
            var marker = new google.maps.Marker({
                position: o.pos,
                map: this.map,
                title: 'Test'
            });
        }
        if (markers.length>=2) {
            var bounds = new google.maps.LatLngBounds(markers[0].pos, markers[1].pos);
            this.map.fitBounds(bounds);
        }
        if (val.polyline) {
			var path=this.decode_points(val.polyline);
			console.log("polyline path",path);
			var poly=new google.maps.Polyline({
				path: path,
				map: this.map,
				strokeWidth: 4,
				strokeColor: "#99f",
			});
        }
    }

	decode_points(t,e) {
		for(var n,o,u=0,l=0,r=0,d= [],h=0,i=0,a=null,c=Math.pow(10,e||5);u<t.length;){a=null,h=0,i=0;do a=t.charCodeAt(u++)-63,i|=(31&a)<<h,h+=5;while(a>=32);n=1&i?~(i>>1):i>>1,h=i=0;do a=t.charCodeAt(u++)-63,i|=(31&a)<<h,h+=5;while(a>=32);o=1&i?~(i>>1):i>>1,l+=n,r+=o,d.push([l/c,r/c])}return d=d.map(function(t){return{lat:t[0],lng:t[1]}})
	}
}

class Page extends React.Component {
    constructor(props) {
        console.log("Page.constructor page="+props.page);
        super(props);
		if (!props.container) throw "Missing container";
        this.key=0;
        this.components={};
        this.state={data:props.data||{}};
        this._mounted=false;
        this.load_page();
    }

    load_page() {
        console.log("Page.load_page "+this.props.page);
        if (!this.props.page) {
            throw new Error("Missing page path");
		}
        this.page_info=this.props.container.get_page(this.props.page);
        if (!this.page_info) {
            this.page_info=this.props.container.get_page("notfound");
            if (!this.page_info) {
                throw "Page not found: "+this.props.page;
            }
        }
        //console.log("=> page_info",this.page_info);
        if (!this.page_info.layout) throw "Missing page layout";
        try {
            this.layout=JSON.parse(this.page_info.layout);
        } catch (err) {
            throw new Error("Invalid layout: "+err,this.page_info.layout);
        }
        console.log("=> register",this.props.page);
        if (this.props.root) { 
            this.props.root.register_component(this.props.page,this);
        }
        //console.log("=> layout",this.layout);
        this.load_code();
    }

    load_code() {
        console.log("Page.load_code "+this.props.page);
        var page_info=this.page_info;
        if (!this.page_info) throw "Missing page layout";
        var code=page_info.code||"";
        var page_ctx={
            _: _,
            moment: moment,
            get_data: this.get_data.bind(this),
            set_data: this.set_data.bind(this),
            rpc_execute: this.rpc_execute.bind(this),
            set_cookie: this.set_cookie.bind(this),
            get_cookie: this.get_cookie.bind(this),
            clear_cookie: this.clear_cookie.bind(this),
            redirect: this.redirect.bind(this),
            redirect_post: this.redirect_post.bind(this),
            set_page: this.set_page.bind(this),
            show_popup: this.show_popup.bind(this),
            close_popup: this.close_popup.bind(this),
            print_page: this.print_page.bind(this),
            page_params: this.props,
            get_component: this.get_component.bind(this),
            set_language: this.set_language.bind(this),
            translate: this.translate.bind(this),
            update_title: this.update_title.bind(this),
            Model: Model,
            fields: fields,
            get_model: get_model,
            serialport: serialport,
            dialog: dialog,
            set_offline: this.set_offline.bind(this),
            get_offline: this.get_offline.bind(this),
        };
        this.code_eval=(expr,ctx)=>{
            //console.log("code_eval",this.props.page,expr,ctx);
            var context={};
            Object.assign(context,page_ctx);
            if (ctx) Object.assign(context,ctx);
            var res=eval_with_context(context)(code+";"+expr);
            //console.log("=> res",res);
            return res;
        }
        var f=null;
        try {
            f=this.code_eval("on_load");
        } catch (err) {
        }
        if (f) {
            var res=f();
            if (res) {
                res.catch(err=>{
                    if (err) console.error(t("Error")+": "+t(err));
                });
            }
        }
    }

    componentDidMount() {
        console.log("Page.componentDidMount "+this.props.page);
		this._mounted=true;
        if (this.next_page) {
            this.props.container.set_page(this.next_page,this.next_params);
            window.scrollTo(0,0);
            this.next_page=null;
            this.next_params=null;
        }
        if (this.deferred_update_title) {
            this.update_title();
            this.deferred_update_title=false;
        }
    }

    componentWillUmount() {
        console.log("Page.componentWillUnmount");
        this._mounted=false;
    }

    get_data() {
        return this.state.data||{};
    }

    set_data(vals) {
        console.log("set_data");
		var data=this.state.data||{};
		Object.assign(data,vals);
        if (this._mounted) {
            this.forceUpdate();
        }
    }

    register_component(name,comp) {
        console.log("register_component",name);
        this.components[name]=comp;
    }

    get_component(name) {
        var comp=this.components[name];
        if (!comp) {
            console.error("component not found",name);
            return;
        }
        return comp;
    }

    rpc_execute(model,method,args,opts) {
        return rpc.execute(model,method,args,opts);
    }

    set_cookie(name,val) {
	utils.set_cookie(name,""+val);
    }

    get_cookie(name) {
	utils.get_cookie(name);
    }

    clear_cookie(name) {
	utils.clear_cookie(name);
    }

    set_language(val) {
        console.log("set_language",val);
		utils.set_cookie("locale",""+val); // KMN:TODO
        i18n.set_active_lang(""+val);
    }

    translate(val) {
        return t(val);
    }

    update_title() {
        if (this._mounted) {
            var title=this.layout.title;
            if (!title) {
                title=this.props.page;
                title=title.charAt(0).toUpperCase() + title.slice(1);
            }
            if (title.includes("{")) {
                title=t(title)
                var data=this.state.data||{};
                title=replace_field_values(title,data);
                window.document.title=title
            }
        } else {
            this.deferred_update_title=true;
        }
    }

    redirect(url) {
        console.log("redirect",url);
        if (url.startsWith("http://") || url.startsWith("https://")) {
            window.location=url;
            return;
        }
		//Router.push(url);
    }

    redirect_post(url,params) {
        console.log("redirect_post",url,params);
        var form = document.createElement("form");
        form.setAttribute("method", "post");
        form.setAttribute("action", url);
        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                var hiddenField = document.createElement("input");
                hiddenField.setAttribute("type", "hidden");
                hiddenField.setAttribute("name", key);
                hiddenField.setAttribute("value", params[key]);
                form.appendChild(hiddenField);
            }
        }
        document.body.appendChild(form);
        console.log("form",form);
        form.submit();
    }

    set_page(page,params) {
        console.log("Page.set_page",page,params);
        if (!this._mounted) {
            console.log("WARNING: calling set_page in unmounted page");
            this.next_page=page;
            this.next_params=params;
            return;
        }
        this.props.container.set_page(page,params);
        //setTimeout(()=>{
            window.scrollTo(0,0);
        //},200);
    }

    show_popup(page,params) {
        console.log("show_popup",page,params);
        this.props.container.set_popup_page(page,params);
    }

    close_popup() {
        console.log("close_popup");
        this.props.container.set_popup_page(null);
    }

    print_page(page,params,print_opts) {
        console.log("Page.print_page",page,params,print_opts);
        electron.ipcRenderer.send("print_page",page,params,print_opts);
    }

    render() {
        console.log("Page.render");
        var layout=this.layout;
        if (!layout) throw "Missing page layout";
        var style={display:"flex",flexDirection:"column",flex:1};
        if (layout.font_name) style.fontFamily=layout.font_name;
        if (layout.font_size) style.fontSize=layout.font_size+"px";
		var ctx={};
		ctx.data=this.state.data;
        console.log("page render data",ctx.data);
        return <div style={style}>
            {(()=>{
                return <ElementList elements={layout.elements} root={this} context={ctx}/>;
            })()}
        </div>;
    }

    set_offline(offline) {
        if (offline) {
            localStorage.setItem("offline","1");
        } else {
            localStorage.setItem("offline","");
        }
    }

    get_offline() {
        var val=localStorage.getItem("offline");
        return val?true:false;
    }
}

var _site_params=null;
var _back_button_pressed=false; // XXX

class PageContainer extends React.Component {
    constructor(props) {
        //console.log("PageContainer.constructor",props);
        super(props);
        var page=props.page||"index";
        //var dbname="nfo_topfruits";
        var dbname=localStorage.getItem("dbname");
        var base_url="https://backend-prod2.netforce.com";
        rpc.set_base_url(base_url);
        rpc.set_database(dbname);
        this.state={
            dbname: dbname,
            page: page,
            page_params: {},
        };
        this.key=0;
        init_db("nf_page_db");
        //var resize_t=_.throttle(this.resize.bind(this),1000);
        //window.addEventListener("resize",resize_t);
        window.addEventListener("offline",this.check_offline.bind(this));
        this.check_online_int=setInterval(this.check_online.bind(this),10*60*1000);
    }

    check_offline() {
        if (!navigator.onLine) { 
            console.log("=> set offline");
            this.set_offline(true);
        }
    }

    check_online() {
        console.log("check_online");
        if (navigator.onLine) {
            console.log("=> set online");
            this.set_offline(false);
        }
    }

    set_offline(offline) {
        if (offline) {
            localStorage.setItem("offline","1");
        } else {
            localStorage.setItem("offline","");
        }
    }

    get_offline() {
        var val=localStorage.getItem("offline");
        return val?true:false;
    }

    resize() {
        console.log("resize");
        this.forceUpdate();
    }

    async load_pages(page_group) {
        console.log("load_pages");
        var offline=this.get_offline();
        if (offline) {
            console.log("Loading pages offline...");
            var res=await get_model("page.layout").search_read([],["path","layout","code"]);
            console.log("=> "+res.length+" pages loaded from db");
            var pages={};
            for (var r of res) {
                pages[r.path]=r;
            }
            console.log("=> pages",pages);
            this.pages=pages;
        } else {
            console.log("Loading pages online...");
            var cond=[];
            if (page_group) cond.push(["group_id.code","=",page_group]);
            var fields=["path","layout","code","model_id.name"];
            var res=await rpc.execute("page.layout","search_read_path",[cond,fields],{});
            if (res.length==0) throw "No pages in group: "+page_group;
            console.log("=> "+res.length+" pages loaded");
            var pages={};
            for (var r of res) {
                pages[r.path]=r;
            }
            console.log("=> pages",pages);
            this.pages=pages;
            for (var r of res) {
                var vals={
                    path: r.path,
                    layout: r.layout,
                    code: r.code,
                };
                get_model("page.layout").merge(vals);
            }
        }
        this.forceUpdate();
    }

    componentDidMount() {
        console.log("PageContainer.componentDidMount");
        /*Router.beforePopState(({as}) => {
            location.href = as;
        });*/
        this.load_pages(this.props.page_group);
    }

    componentWillReceiveProps(props) {
        console.log("PageContainer.componentWillReceiveProps",props,this.props);
        //if (back_button_pressed) {
        if (false) {
            this.key+=1;
            this.setState({
                page: props.page,
                page_params: props.query||{},
            });
            _back_button_pressed=false;
        }
    }

    componentWillUnmount() {
        console.log("PageContainer.componentWillUnmount");
        if (this.check_online_int) {
            clearInterval(this.check_online_int);
        }
    }

    render() {
        console.log("PageContainer.render");
        if (!this.state.dbname) {
            return <div>
                Select database:
                <input type="text" value={this.state.db_input||""} onChange={e=>this.setState({db_input:e.target.value})}/> .smartb.co
                <button onClick={this.select_db.bind(this)}>Confirm</button>
            </div>;
        }
        if (!this.pages) return <Loading/>;
        var page_info=this.get_page(this.state.page);
        if (!page_info) {
            page_info=this.get_page("notfound");
            if (!page_info) {
                throw "Page not found: "+this.state.page;
            }
        }
        if (!page_info.layout) throw "Missing page layout";
		var layout={};
        try {
            layout=JSON.parse(page_info.layout);
        } catch (err) {
            throw new Error("Invalid layout: "+err,page_info.layout);
        }
		var title=layout.title;
        if (!title) {
            title=this.state.page;
            title=title.charAt(0).toUpperCase() + title.slice(1);
        }
        title=t(title)
        title=replace_field_values(title,{});
        var style={display:"flex",flexDirection:"column"};
        return <div style={style}>
        	<Page key={this.key} page={this.state.page} container={this} {...this.state.page_params} data={this.props.data}/>
			{(()=>{
				if (!this.state.popup_page) return;
				return <Modal show>
					<Modal.Body>
						<Page key={this.popup_key} page={this.state.popup_page} container={this} {...this.state.popup_page_params} data={this.props.data}/>
					</Modal.Body>
				</Modal>;
			})()}
        </div>;
    }

    set_page(page,params) {
        console.log("PageContainer.set_page",page,params);
        this.key+=1;
        this.setState({page:page,page_params:params||{}});
        var url="/?page="+page;
        if (!_.isEmpty(params)) {
            var qs=utils.make_qs(params);
            url+="&"+qs;
        }
        /*console.log("router push",Router.pathname,url);
        Router.push(Router.pathname,url,{shallow:true});*/
    }

    set_popup_page(page,params) {
        console.log("PageContainer.set_popup_page",page,params);
        this.popup_key+=1;
        this.setState({popup_page:page,popup_page_params:params||{}});
    }

	get_page(page) {
		console.log("PageContainer.get_page",page);
        var pages=this.pages;
        if (!pages) {
            //console.log("root props",this.props.root.props);
            throw new Error("Missing pages");
        }
        var page_info=pages[page];
		return page_info;
	}

    select_db() {
        var db=this.state.db_input;
        if (!db) {
            alert("Missing db name");
            return;
        }
        var dbname="nfo_"+db;
        rpc.set_database(dbname);
        this.setState({dbname:dbname});
        localStorage.setItem("dbname",dbname);
    }
}

export default PageContainer;
