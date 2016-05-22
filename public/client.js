var socket = io.connect();
socket.on("connected", function(data){
  var userid = data.id;
  console.log("connected.  Userid is " + userid);
});

socket.on("disconnect", function(){
  location.reload();
})

socket.on("host", function(data){
  game = data.game;
  role = "host";
  console.log("You are the host of game " + game);
  bottomDisplay.innerHTML = "Searching for opponent";
});

socket.on("client", function(data){
  game = data.game;
  role = "client";
  opponentFound = true;
  bottomDisplay.innerHTML = "Opponent found. Press space when ready.";
  console.log("You are the client of game " + game);
});

socket.on("clientFound", function(){
  opponentFound = true;
  bottomDisplay.innerHTML = "Opponent found. Press space when ready.";
})

socket.on("begin", function(){
  gameActive = true;
  bottomDisplay.style.display = "none";
  mainloop();
});

socket.on("update", function(data){
  if(role == "host"){
    playerTwoBumper.yPosition = data.position;
  }else{
    playerOneBumper.yPosition = data.position;
  }
  ball.xPosition = data.ballX;
  ball.yPosition = data.ballY;
});

socket.on("score", function(data){
  console.log("score");
  if(data.player == "p1"){
    playerOneScore.incrementScore();
  }else if(data.player == "p2"){
    playerTwoScore.incrementScore();
  }
})
