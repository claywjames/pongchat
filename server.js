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
  joinedGames : [],
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
    console.log("game " + newGame.id + " created");
  },
  joinGame : function(client){
    if(gameServer.games.length === 0){
      gameServer.createGame(client);
    } else{
      var gameToJoin = gameServer.games.pop();
      gameToJoin.client = client;
      gameServer.joinedGames.push(gameToJoin);
      client.emit("client", {game : gameToJoin.id});
      io.to(gameToJoin.host.id).emit("clientFound");
    }
  },
  findGameByID : function(gameID){
    function correctGame(game){
      return game.id == this;
    }
    return gameServer.joinedGames.find(correctGame, gameID);
  },
  findGameByClient : function(client){
    function correctGame(game){
      return (game.client == this || game.host == this);
    }
    if(typeof gameServer.joinedGames.find(correctGame, client) === "undefined"){
      return gameServer.games.find(correctGame, client);
    }else{
      return gameServer.joinedGames.find(correctGame, client);
    }
  },
  deleteGame : function(gameToDelete){
    var j = gameServer.joinedGames.indexOf(gameToDelete);
    var g = gameServer.games.indexOf(gameToDelete);
    if(j != -1){
      gameServer.joinedGames.splice(j,1);
    } else if(g != -1){
      gameServer.games.splice(g,1);
    }
    console.log("Game " + gameToDelete.id + " deleted");

  }
};

io.on('connection', function(client) {
  console.log("Client connected.  ID: " + client.id);
  client.emit("onconnect", {id : client.id});
  client.on("disconnect", function(){
    console.log("Client disconnected.  ID: " + client.id);
    if(typeof gameServer.findGameByClient(client) != "undefined"){
      desertedGame = gameServer.findGameByClient(client);
      if(client == desertedGame.host && desertedGame.client != null){
        io.to(desertedGame.client.id).emit("disconnect");
      }else if(client == desertedGame.client){
        io.to(desertedGame.host.id).emit("disconnect");
      }
      gameServer.deleteGame(desertedGame);
    }
  });
  gameServer.joinGame(client);
  client.on("ready", function(data){
    var game = gameServer.findGameByID(data.gameID);
    var role = data.user;
    if(role == "host") game.hostReady = true;
    if(role == "client") game.clientReady = true;
    if(game.hostReady && game.clientReady){
      game.gameActive = true;
      console.log("Game " + game.id + " active");
      io.to(game.host.id).emit("begin");
      io.to(game.client.id).emit("begin");
    }
  })
});
