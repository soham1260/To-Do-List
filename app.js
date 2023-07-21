//!!!!!! There are two types of lists one which has default home route and other(Referred to as custom list in various parts of program) which is made is route is set to anything other due to which there are two collections
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');//-----1
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');//it allows you to use EJS templates to render dynamic content on the server and send it as a response to the client.

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://1260soham:<password>@cluster0.yaniyqu.mongodb.net/todolistDB");//-----2

const itemsSchema = { //-----3 //default list on home route
  name: String
}

const Item = mongoose.model("Item",itemsSchema);//-----4

const item1 = new Item({//-----5
  name: "Welcome to your to do list"
});

const item2 = new Item({//-----6
  name: "Hit + Button to add"
});

const item3 = new Item({//-----7
  name: "<-- Hit this to delete"
});

const defaultItems = [item1,item2,item3];//-----8

const listSchema = { //custom lists on custom route
  name: String, //custom list name
  items: [itemsSchema]
}

const List = mongoose.model("List",listSchema);//collection name is determined by pluralizing model name(first "List")

app.get("/",function(req,res)
{
  Item.find({})
  .then((foundItems) =>{//-----10//array of foundItems(Item)
    if(foundItems.length === 0)
    {
      Item.insertMany(defaultItems)//-----9
      .then(() => {
        console.log("Successfully added");
      })
      .catch((err) => {
        console.log(err);
      });
      res.redirect("/");//-----11 first time new items will be added and second time when it will be redirected else statement will be called
    }
    else
    {
      res.render("list",{listTitle:"Today",newListItems:foundItems});//-----12 //foundItems(Item) ARRAY passed
    }
  })
});  

app.post("/", function(req, res){

  const itemName = req.body.newItem;//-----12 new item added (name="newItem")
  const listName = req.body.list;//-----16 (name="list")

  const item = new Item({
    name: itemName
  })

  if(listName === "Today") //listName = req.body.list  //name="list" value="<%=listTitle%>" //listTitle==value==Today
  {
    item.save();
    res.redirect("/");//-----17 redirected (else statement used)
  }
  else//items comes from a custom list
  {
    List.findOne({name: listName})
    .then((foundList) =>
    {
        foundList.items.push(item);//push into array of items //items: [itemsSchema]
        foundList.save();
        res.redirect("/"+listName);
    })
    .catch((err) => {
      console.log(err);
    });
  }
  // item.save();
  // res.redirect("/");//-----13 redirected (else statement used)
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox; // corrosponding value is returned
  const listName = req.body.listName;

  if(listName === "Today")//-----16 //"Today" is value of default list else listName will contain value of custom routes
  {
    Item.findByIdAndRemove(checkedItemId)//In default list items are directly available
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
  }
  else//-----17
  {
    List.findOneAndUpdate({name:listName},{$pull: {items: {_id:checkedItemId}}}).then((foundList) => //In custom list, find the object using "name" which contains the items array
    {
        res.redirect("/"+listName);
    })
    .catch((err) => {
      console.log(err);
    });
  }
});

app.get("/:customListName",function(req,res){//-----14
  const customListName=_.capitalize(req.params.customListName);

  List.findOne({name:customListName})//-----15 remember the syntax // finding in "lists" collection
  .then((foundList) =>
  {
      if(!foundList)
      {
        const list = new List({ // If list does not exist a default list is created
          name:customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/"+customListName);
      }
      else
      {
        res.render("list",{listTitle:foundList.name,newListItems:foundList.items})//Items array passed
      }
  })
  .catch((err) => {
    console.log(err);
  });
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
