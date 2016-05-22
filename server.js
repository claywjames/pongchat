var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var uuid = require("node-uuid");
var pong = require(__dirname + "/public/pong");

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
    this.bumperOne = new pong.bumper(0);
    this.bumperTwo = new pong.bumper(875);
    this.ball = new pong.ball();
    this.p1Score = 0;
    this.p2Score = 0;
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
  client.emit("connected", {id : client.id});
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
  });
  client.on("host_update", function(data){
    var game = gameServer.findGameByClient(client);
    game.bumperOne.yPosition = data.position;
  });
  client.on("client_update", function(data){
    var game = gameServer.findGameByClient(client);
    game.bumperTwo.yPosition = data.position;
  });
});

setInterval(function(){
  for(var i = 0; i < gameServer.joinedGames.length; i++){
    if(gameServer.joinedGames[i].gameActive){
      game = gameServer.joinedGames[i];
      io.to(game.host.id).emit("update", {
        position: game.bumperTwo.yPosition,
        ballX: game.ball.xPosition,
        ballY: game.ball.yPosition
      });
      io.to(game.client.id).emit("update", {
        position: game.bumperOne.yPosition,
        ballX: game.ball.xPosition,
        ballY: game.ball.yPosition
      });
      pong.detectCollisions(game.bumperOne, game.bumperTwo, game.ball)
      scorer = pong.detectScores(game.p1Score, game.p2Score, game.ball);
      if(scorer == "p1"){
        io.to(game.host.id).emit("score",{player: "p1"});
        io.to(game.client.id).emit("score",{player: "p1"});
      }else if(scorer == "p2"){
        io.to(game.host.id).emit("score",{player: "p2"});
        io.to(game.client.id).emit("score",{player: "p2"});
      }
      game.ball.updatePosition();
    }
  }
}, 16)
