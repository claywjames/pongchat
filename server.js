var express = require("express");
var app = express();

app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res){
  res.sendFile("./public/index.html");
});

app.get("/singleplayer", function(req, res){
  res.sendFile(__dirname + "/public/main.html");
});

app.get("/twoplayer", function(req, res){
  res.sendFile(__dirname + "/public/main.html");
});

app.get("/twoplayer_online", function(req, res){
  res.sendFile(__dirname + "/public/main.html");
});

app.listen(3000);
console.log("running...");
