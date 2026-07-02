import express from "express";
import bodyParser from "body-parser";
const app= express();
app.use(bodyParser.urlencoded({extended:true}));
const port=3000;
app.use(express.static("public"));
app.set("view engine", "ejs");
app.get("/",(req,res)=>{
    res.render("index.ejs")
});
app.get("/books",(req,res)=>{
    res.render("books")
});
app.get("/electronics",(req,res)=>{
    res.render("electronics")
});
app.get("/iot",(req,res)=>{
    res.render("iot")
});
app.get("/uniform",(req,res)=>{
    res.render("uniform")
});
app.get("/sell",(req,res)=>{
    res.render("sell")
});
app.get("/profile", (req, res) => {

    res.render("profile");

});
app.get("/messages", (req, res) => {

    res.render("message");

});
app.get("/wishlist", (req, res) => {

    res.render("wishlist");

});
app.listen(port,()=>{
    console.log(`Server is running at port ${port}`)
});
