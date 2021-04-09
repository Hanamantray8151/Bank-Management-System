//js hint version 6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const AppError = require("app-error");
const ejs = require("ejs");
const app = express();

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

function wrapAsync(fn){
    return function(req,res,next){
        fn(req,res,next).catch(e => next(e));
    }
};

mongoose.connect("mongodb+srv://admin-hanamantray:Test-123@cluster0.8ric1.mongodb.net/customerDB?retryWrites=true&w=majority",
                    {useNewUrlParser: true,
                     useUnifiedTopology: true,
                     useFindAndModify: false
                    }
                );

const custSchema = {
    name:String,
    mobno:Number,
    id:Number,
    ackno:Number,
    amount:Number
}
const Cust = mongoose.model("Cust",custSchema);

const historySchema = {
    sendername:String,
    receivername:String,
    money:Number
}
const History = mongoose.model("History",historySchema);

const cust1 = new Cust(
    {name:'Manoj',mobno:8151614187,id:817234,ackno:10297302843,amount:40000});
const cust2 = new Cust(
    {name:'Monika',mobno:9965453423,id:119213,ackno:19327482343,amount:30000});
const cust3 = new Cust(
    {name:'Karan',mobno:9089786534,id:129836,ackno:14523762547,amount:20000});
const cust4 = new Cust(
    {name:'Tarun',mobno:8724879234,id:834723,ackno:12058699503,amount:30000});
const cust5 = new Cust(
    {name:'Akash',mobno:7843957934,id:194870,ackno:13486932484,amount:25000});
const cust6 = new Cust(
    {name:'Kriti',mobno:9089900124,id:491387,ackno:14012937435,amount:55000});   
const cust7 = new Cust(
    {name:'Ankit',mobno:6734857924,id:126879,ackno:14025347777,amount:45000});    
const cust8 = new Cust(
    {name:'Varun',mobno:7637952823,id:991081,ackno:27368926398,amount:40000});
const cust9 = new Cust(
    {name:'Tejas',mobno:8872839912,id:169083,ackno:17980094782,amount:35000}); 
const cust10 = new Cust(
    {name:'Rakshit',mobno:9978999383,id:238934,ackno:23934892367,amount:55000});   
const defaultCusts = [cust1,cust2,cust3,cust4,cust5,cust6,cust7,cust8,cust9,cust10];     


app.get("/",function(req,res){
    res.render("home");
});
app.get("/added",function(req,res){
    Cust.find({},function(err,foundCusts){
        if(foundCusts.length === 0){
            Cust.insertMany(defaultCusts,function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log("Successfully saved customers.");
                }
            });
        }else{
            res.render("added",{customersList:foundCusts});
        }
    });
});
app.get("/login",function(req,res){
    res.sendFile(__dirname+"/views/login.html");
});

app.post("/success",function(req,res){
    var un = req.body.username;
    var pass = req.body.password;
    if(un && pass){
        res.sendFile(__dirname+"/views/success.html");
    }else{
        res.redirect("/login");
    }
});

app.get("/onecust/:custId",function(req,res){
    const requestedCustId = req.params.custId;
    Cust.findOne({_id: requestedCustId},function(err,cust){
        res.render("onecust",{
            name: cust.name,
            ackno: cust.ackno
        });
    });
});

app.get("/history",function(req,res){
    History.find({},function(err,historyData){
        if(err){
            console.log(err);
        }else{
            res.render("history",{data:historyData});
        }
    });
});

app.get("/transfer",function(req,res){
    Cust.find({},function(err,getCustomers){
        if(err){
            console.log(err);
        }else{
            res.render("send",{putCustomers:getCustomers});
        }
    })
    
});
    
app.post("/send",wrapAsync(async(req,res,next) => {
    const Sender = req.body.Sname;
    const Recipient = req.body.Rname;
    const AmountEntered = req.body.Amount;
    const sender = await Cust.findOne({name:Sender});
    const receiver = await Cust.findOne({name:Recipient});
    if(!sender || !receiver){
        throw new AppError("User not found",401);
    }
    if(sender.amount>0 && AmountEntered<sender.amount && AmountEntered>0){
        await Cust.findOneAndUpdate({name:Sender},{amount: parseInt(sender.amount) - parseInt(AmountEntered)});
        await Cust.findOneAndUpdate({name:Recipient},{amount: parseInt(receiver.amount) + parseInt(AmountEntered)});
        res.render("txnsuccess");
    }else if(AmountEntered>sender.amount){
        throw new AppError("You haven't enough balance to take payment",500);
    }else{
        throw new AppError("Amount should be positive",500);
    }
    const H1 = new History({
        sendername:Sender,
        receivername:Recipient,
        money:AmountEntered
    });
    H1.save();
}));

app.listen(process.env.PORT || 2000,function(){
    console.log("Server started on port 2000");
});