//This file provides the instructions for dealing with information from the server
var socket = io.connect() //connect to server

socket.on("connected", function(data){
  //runs after server is connected
  var userid = data.id;
})

socket.on("disconnect", function(){
  //runs if the client's opponent disconnects from the server
  location.reload()
})

socket.on("host", function(data){
  //runs if server declares this client the host of a game
  game = data.game;
  role = "host";
  bottomDisplay.innerHTML = "Searching for opponent";
})

socket.on("client", function(data){
  //runs if the server declares this client the client of a game
  game = data.game;
  role = "client";
  opponentFound = true;
  bottomDisplay.innerHTML = "Opponent found. Press space when ready.";
})

socket.on("clientFound", function(){
  //runs if this client is the host of a game and the server finds a client for the game
  opponentFound = true;
  bottomDisplay.innerHTML = "Opponent found. Press space when ready.";
})

socket.on("begin", function(){
  //runs when both the host and client of a game have indicated they are ready to begin
  gameActive = true;
  bottomDisplay.style.display = "none";
  window.requestAnimationFrame(mainloop)
  context.clearRect(0, 0, 900, 600) //erase canvas
  update()
  draw()
})

socket.on("update", function(data){
  //runs when the client recieves an update from the server
  if(role == "host"){
    opponentPositions = data.b2Positions;
  }else{
    opponentPositions = data.b1Positions;
  }
  gameBallPositions = data.ballPositions;
  updateIndex = 0;
})

socket.on("score", function(data){
  //runs when the server detects a score
  if(data.player == "p1"){
    playerOneScore.incrementScore()
  }else if(data.player == "p2"){
    playerTwoScore.incrementScore()
  }
})

socket.on("win", function(data){
  gameActive = false;
  //turning the playAgainButton(meant for offline mode) into the newGameButton
  var newGameButton = playAgainButton;
  newGameButton.onclick = function(){location.reload()}
  newGameButton.style.display = "block";
  newGameButton.innerHTML = "New Game";
  bottomDisplay.style.display = "block";
  if(data.player == "p1"){
    bottomDisplay.innerHTML = "Player One Wins";
  }else{
    bottomDisplay.innerHTML = "Player Two Wins";
  }
})

socket.on("message", function(data){
  //when recieving a chat message from server(could be own message)
  var message = document.createElement("div");
  message.innerHTML = data.message;
  if(role == data.sender){
    message.setAttribute("class", "ownMessage");
  }else{
    message.setAttribute("class", "opponentMessage");
  }
  chatBox.appendChild(message);
})
