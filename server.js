var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var uuid = require("node-uuid");


server.listen(3000);
console.log("running...");


app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res){
  res.sendFile("./public/index.html");
});

app.get("/twoplayer", function(req, res){
  res.sendFile(__dirname + "/public/pong.html");
});

app.get("/twoplayer_online", function(req, res){
  res.sendFile(__dirname + "/public/pong.html");
});

io.on('connection', function(client) {
  client.userid = uuid();
  console.log("Client connected.  ID: " + client.userid);
  client.emit("onconnect", {id : client.userid});
  client.on("disconnect", function(){
    console.log("Client disconnected.  ID: " + client.userid);
  });
});
