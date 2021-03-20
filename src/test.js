import {Model,fields,get_model,init_db} from "./model"

init_db("test");

class Product extends Model {
    _name="product"
    _fields={
        name: fields.Char("Name"), 
        code: fields.Char("Code"),
        price: fields.Decimal("Price"),
    }
}

Product.register()


async function test() {
    var m=get_model("product");

    var id1=await m.create({name:"test",code:"P-001",price:999})
    console.log("id1",id1);
    var id2=await m.create({name:"test2",code:"P-002",price:999})
    console.log("id2",id2);

    await m.delete([id1]);

    await m.write([id2],{name:"test3"});

    var prods=await m.read([id1,id2],["name"])
    console.log("prods",prods);

    var ids=await m.search([]);
    console.log("ids",ids);

    await m.delete(ids);
}

test();
