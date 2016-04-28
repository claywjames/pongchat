var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);


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
  res.sendFile(__dirname + "/public/pong_online.html");
});

io.on('connection', function(client) {
  console.log('Client connected...');
  client.on('join', function(data) {
    console.log(data);
  });
});
