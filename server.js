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


var gameServer = {
  games : [],
  activeGames : [],
  game : function(host){
    this.id = uuid();
    this.host = host;
    this.client = null;
    this.hostReady = false;
    this.clientReady = false;
    this.gameActive = false;
  },
  createGame : function(host){
    var newGame = new gameServer.game(host);
    gameServer.games.unshift(newGame);
    host.emit("host", {game : newGame.id});
  },
  joinGame : function(client){
    if(gameServer.games.length === 0){
      gameServer.createGame(client);
    } else{
      var gameToJoin = gameServer.games.pop();
      gameToJoin.client = client;
      gameServer.activeGames.push(gameToJoin);
      client.emit("client", {game : gameToJoin.id});
    }
  },
  findGame : function(gameID){
    function correctGame(game){
      return game.id == this;
    }
    return gameServer.activeGames.find(correctGame, gameID);
  }
};

io.on('connection', function(client) {
  client.userid = uuid();
  console.log("Client connected.  ID: " + client.userid);
  client.emit("onconnect", {id : client.userid});
  client.on("disconnect", function(){
    console.log("Client disconnected.  ID: " + client.userid);
  });
  gameServer.joinGame(client);
  client.on("ready", function(data){
    var game = gameServer.findGame(data.gameID);
    var role = data.user;
    if(role == "host") game.hostReady = true;
    if(role == "client") game.clientReady = true;
    if(game.hostReady && game.clientReady){
      game.gameActive = true;
      console.log("Game " + game.id + " active");
    }
  })
});
