var express = require("express")
var app = express()
var server = require("http").createServer(app)
var io = require("socket.io")(server)
var uuid = require("node-uuid") //used for game IDs
var pong = require(__dirname + "/public/pong")

server.listen(process.env.PORT || 3000)
console.log("running...")

//Routing
app.use(express.static(__dirname + "/public"))
app.get("/", function(req, res){
  res.sendFile("./public/index.html")
})
app.get("/twoplayer", function(req, res){
  res.sendFile(__dirname + "/public/pong.html")
})
app.get("/twoplayer_online", function(req, res){
  res.sendFile(__dirname + "/public/pong.html")
})


var gameServer = {
  games : [],
  joinedGames : [],

  game : function(host){
    //Constructor for the game object
    this.id = uuid()
    this.host = host;
    this.client = null;
    this.hostReady = false;
    this.hostLatency = 0;
    this.clientReady = false;
    this.clientLatency = 0;
    this.gameActive = false;
    this.bumperOne = new pong.bumper(0)
    this.bumperTwo = new pong.bumper(875)
    this.ball = new pong.ball()
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
    //if a client disconnects
    console.log("Client disconnected.  ID: " + client.id);
    if(typeof gameServer.findGameByClient(client) != "undefined"){
      //if the client who disconnected was in a game
      desertedGame = gameServer.findGameByClient(client);
      if(client == desertedGame.host && desertedGame.client != null){
        //if the client who disconnected was the host, and there was a client in his game
        io.to(desertedGame.client.id).emit("disconnect");
      }else if(client == desertedGame.client){
        //if the client was the client of a game
        io.to(desertedGame.host.id).emit("disconnect");
      }
      gameServer.deleteGame(desertedGame);
    }
  })

  gameServer.joinGame(client);

  client.on("ready", function(){
    //when the client signals he is ready for the game to begin
    var game = gameServer.findGameByClient(client);
    if(game.host == client) game.hostReady = true;
    if(game.client == client) game.clientReady = true;
    if(game.hostReady && game.clientReady){
      game.gameActive = true;
      console.log("Game " + game.id + " active");
      io.to(game.host.id).emit("begin");
      io.to(game.client.id).emit("begin");
    }
  })

  client.on("host_update", function(data){
    //when the client who is the host of a game sends a game update
    var game = gameServer.findGameByClient(client);
    game.hostLatency = (2 * (Date.now() - data.t)) + 64; // 2 * trip time = round trip; round trip + 64(clients are updated every 64ms with an array of positions) = total latency in ms
    if(data.request == "up"){game.bumperOne.moveUp()}
    else if(data.request == "down"){game.bumperOne.moveDown()}
    game.bumperOne.pastStates.push(game.bumperOne.yPosition);
    game.bumperOne.pastStates.splice(0,1);
  })

  client.on("client_update", function(data){
    //when the client who is the client of a game sends a game update
    var game = gameServer.findGameByClient(client);
    game.clientLatency = (2 * (Date.now() - data.t)) + 64; // 2 * trip time = round trip; round trip + 64(clients are updated every 64ms with an array of positions) = total latency in ms
    if(data.request == "up"){game.bumperTwo.moveUp()}
    else if(data.request == "down"){game.bumperTwo.moveDown()}
    game.bumperTwo.pastStates.push(game.bumperTwo.yPosition);
    game.bumperTwo.pastStates.splice(0,1);
  })
})

var framesBehind = 0;

var butterflyEffect = function(ball, array, framesInPast){
  //Since the server rewinds time to check collisions and scores in the past, if there is a score or collision, all future frames must be changed
  //this function handles that
  array.splice((array.length - framesInPast) - 1);
  for(i = 0; i < framesInPast; i++){
    ball.updatePosition();
  }
}

//Game update loop
setInterval(function(){
  for(var i = 0; i < gameServer.joinedGames.length; i++){
    //for each game in the server
    if(gameServer.joinedGames[i].gameActive){
      //if the game is active
      game = gameServer.joinedGames[i];
      var curBallX = game.ball.xPosition; //used to hold the actual x position of the ball
      var curBallY = game.ball.yPosition; //used to hold the actual y position of the ball

      //network latency compensation happens next. the server calculates where the player thinks the ball was in relation to his paddle,
      //and puts the ball there for collision and score detections
      if(game.ball.xPosition < 450){
        //if the ball is on player one's side of the field
        //when calculating the frames behind, sometimes in the beginning of the game, sometimes a very high number would be calculated; thats why I used the ternary operator
        framesBehind = Math.floor(game.hostLatency / 16) > 50 ? framesBehind : Math.floor(game.hostLatency / 16);
        game.ball.xPosition = game.ball.pastStates[(game.ball.pastStates.length - framesBehind) - 1][0]; // <-- Usually this is where errors happen if they do: (game.ball.pastStates.length - framesBehind) - 1 isn't an index
        game.ball.yPosition = game.ball.pastStates[(game.ball.pastStates.length - framesBehind) - 1][1];
      }else{
        //if the ball is on player two's side of the field
        //when calculating the frames behind, sometimes in the beginning of the game, sometimes a very high number would be calculated; thats why I used the ternary operator
        framesBehind = Math.floor(game.clientLatency / 16) > 50 ? framesBehind : Math.floor(game.clientLatency / 16);
        game.ball.xPosition = game.ball.pastStates[(game.ball.pastStates.length - framesBehind) - 1][0];
        game.ball.yPosition = game.ball.pastStates[(game.ball.pastStates.length - framesBehind) - 1][1];
      }

      if(pong.detectCollisions(game.bumperOne, game.bumperTwo, game.ball)){
        butterflyEffect(game.ball, game.ball.pastStates, framesBehind);
        var collision = true;
      }else{
        var collision = false;
      }

      scorer = pong.detectScores(game.p1Score, game.p2Score, game.ball); //will return "p1" or "p2" if a score happens
      if(scorer == "p1"){
        io.to(game.host.id).emit("score",{player: "p1"});
        io.to(game.client.id).emit("score",{player: "p1"});
        butterflyEffect(game.ball, game.ball.pastStates, framesBehind);
      }else if(scorer == "p2"){
        io.to(game.host.id).emit("score",{player: "p2"});
        io.to(game.client.id).emit("score",{player: "p2"});
        butterflyEffect(game.ball, game.ball.pastStates, framesBehind);
      }else if(!collision){
        //if no score and no collision, reset ball position
        game.ball.xPosition = curBallX;
        game.ball.yPosition = curBallY;
      }
      game.ball.updatePosition();
    }
  }
}, 16)

//client update loop
setInterval(function(){
  for(var i = 0; i < gameServer.joinedGames.length; i++){
    if(gameServer.joinedGames[i].gameActive){
      game = gameServer.joinedGames[i];
      var b1Positions = game.bumperOne.pastStates.slice(game.bumperOne.pastStates.length - 4); //the last 4 positions of bumper one
      var b2Positions = game.bumperTwo.pastStates.slice(game.bumperTwo.pastStates.length - 4); //the last 4 positions of bumper two
      var ballPositions = game.ball.pastStates.slice(game.ball.pastStates.length - 4); //the last 4 positions of the ball
      io.to(game.host.id).emit("update", {
        b2Positions: b2Positions,
        ballPositions: ballPositions
      });
      io.to(game.client.id).emit("update", {
        b1Positions: b1Positions,
        ballPositions: ballPositions
      });
    }
  }
}, 64)
